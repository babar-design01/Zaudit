import type { FormProbe } from '../browser';
import type { Instance, RuleOutcome } from '../contract';
import type { UxFacts } from '../probe-ux';
import {
  atDocument,
  atElement,
  docEvidence,
  elEvidence,
  plural,
  union,
  type Evaluator,
  type Need,
  type RuleContext,
} from './acc';

/**
 * How each UX rule is measured.
 *
 * The audit reads one page, at 1440×900, on a site it does not own. So it types
 * into fields and asks forms to validate themselves, presses Escape and clicks a
 * modal's backdrop — but never submits, never presses a destructive control, and
 * never follows a flow to its next step. A rule that needs one of those says so
 * as `not_evaluated`, with the reason, rather than guessing.
 */

const SCREENSHOT = 'viewport@1440x900';

/* ================================================================ helpers */

function ux(ctx: RuleContext, ruleId: string): Need<UxFacts> {
  if (!ctx.measured) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: ctx.noBrowser ?? 'No browser was available to render the page.' } };
  const u = ctx.measured.ux;
  if (!u.ok) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `The usability facts could not be read: ${u.error}` } };
  return { ok: true, value: u.value };
}

function formProbes(ctx: RuleContext, ruleId: string): Need<FormProbe[]> {
  const f = ctx.measured!.forms;
  if (!f.ok) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `The form probe could not run: ${f.error}` } };
  return { ok: true, value: f.value };
}

const notEvaluated = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_evaluated', reason });
const notApplicable = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_applicable', reason });

/** Browser first, then the reason the rule itself cannot run. */
function cannot(ruleId: string, reason: string): Evaluator {
  return (ctx) => (ctx.measured ? notEvaluated(ruleId, reason) : notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.'));
}

const within = (a: number, b: number) => Math.abs(a - b) <= 0.1 * Math.max(a, b, 0.0001);
const q = (s: string, n = 60) => `"${s.length > n ? s.slice(0, n - 1) + '…' : s}"`;

/** Forms a user can act on in the first screen — search boxes are not forms in this sense. */
const actionForms = (u: UxFacts) => u.forms.filter((f) => f.inView && !f.search);

const fieldName = (f: { visibleLabel: string | null; placeholder: string; nameAttr: string | null; type: string }) =>
  f.visibleLabel || f.placeholder || f.nameAttr || f.type;

/* ================================================================= CTAs */

const UX_001: Evaluator = (ctx) => {
  const ruleId = 'UX-001';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const filled = u.value.ctas.filter((c) => c.filled);
  if (!u.value.ctas.length) return notApplicable(ruleId, 'No call-to-action buttons on the first screen.');

  const pairRegions = u.value.ctaRegions.filter((r) => r.equalPairs > 0).length;
  const withCtas = u.value.ctaRegions.filter((r) => r.filled > 0).length;
  if (pairRegions >= 3 && pairRegions >= 0.8 * withCtas) {
    return notApplicable(ruleId, `Equal-weight button pairs repeat in ${pairRegions} of ${withCtas} sections, which makes them a system rather than a competing pair.`);
  }

  const byRegion = new Map<string, typeof filled>();
  for (const c of filled) byRegion.set(c.region, [...(byRegion.get(c.region) ?? []), c]);

  const instances: Instance[] = [];
  for (const group of byRegion.values()) {
    if (group.length < 2) continue;
    const [lead] = group;
    const equal = group.filter(
      (c) => c.fill === lead.fill && within(c.area, lead.area) && within(c.fillContrast ?? 0, lead.fillContrast ?? 0),
    );
    // A pricing table's one-per-tier buttons, and a header button next to a body one, are deliberate.
    const competing = equal.filter((c) => !c.tierCard);
    if (competing.length < 2 || new Set(competing.map((c) => c.sticky)).size > 1) continue;

    const signals = ['fill, size and contrast within 10% of each other'];
    const destinations = new Set(competing.map((c) => c.href || c.label.toLowerCase()));
    if (destinations.size > 1) signals.push(`they lead to different places (${competing.map((c) => q(c.label, 30)).join(', ')})`);
    if (competing.every((c) => c.conversion)) signals.push('every one of them is labelled as the action to take');

    const box = union(competing.map((c) => c.box));
    if (!box) continue;
    const inst = atElement(
      { selector: competing.map((c) => c.selector).join(', '), box },
      `${competing.length} filled buttons with the same visual weight in one region: ${competing.map((c) => q(c.label, 30)).join(', ')}`,
      'one filled primary per region; the others outline or text',
      {
        selector_group: competing.map((c) => c.selector),
        computed_weight_scores: competing.map(
          (c) => `${q(c.label, 30)}: fill ${c.fill}, ${c.box.w}×${c.box.h}px${c.fillContrast != null ? `, ${c.fillContrast}:1 against its background` : ''}`,
        ),
      },
      { confidence: 0.8, rootCause: lead.regionSelector, signals },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: filled.length };
  const rep = filled[0] ?? u.value.ctas[0];
  return {
    ruleId,
    status: 'pass',
    checked: u.value.ctas.length,
    note: filled.length
      ? `Each region of the first screen has one filled primary button (${q(rep.label, 40)} among ${plural(u.value.ctas.length, 'call to action', 'calls to action')}).`
      : `No two buttons on the first screen compete at the same visual weight.`,
    evidence: elEvidence(rep, `${q(rep.label, 40)} is the only filled button in its region`, 'one filled primary per region'),
  };
};

const UX_002: Evaluator = (ctx) => {
  const ruleId = 'UX-002';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const conv = u.value.conversionInView;
  if (conv.length) {
    const c = conv[0];
    return {
      ruleId,
      status: 'pass',
      checked: conv.length,
      note: `The first screen offers ${plural(conv.length, 'action')} to take, led by ${q(c.label, 40)}.`,
      evidence: elEvidence(c, `${q(c.label, 40)} (${c.why}) is within the first 900px`, 'a primary action above the fold'),
    };
  }
  const map = u.value.interactiveInView.slice(0, 20).map((i) => `${q(i.label, 40)} ${i.selector}`);
  return {
    ruleId,
    status: 'fail',
    checked: u.value.interactiveInView.length,
    instances: [
      atDocument(
        'body',
        `No conversion element on the first screen: ${plural(u.value.interactiveInView.length, 'interactive element')}, none a filled button, an action-labelled control or a form`,
        'a primary action within the first 900px, below the value proposition',
        { viewport_screenshot: SCREENSHOT, interactive_element_map: map },
        { confidence: 0.85, rootCause: 'no-primary-action' },
      ),
    ],
  };
};

/* ================================================================ forms */

const PROBLEM = /\b(invalid|incorrect|wrong|error|not valid|failed|is required|required|missing|can'?t be (blank|empty)|cannot be (blank|empty)|is empty|not allowed|bad)\b/i;
const CORRECTIVE = /\b(must|needs?|should|at least|at most|between|use|enter|include|contains?|choose|select|format|like|e\.g\.|example|characters?|digits?|letters?|only|try|such as|add|make sure)\b|\d/i;

const UX_004: Evaluator = (ctx) => {
  const ruleId = 'UX-004';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  if (!actionForms(u.value).length) return notApplicable(ruleId, 'No form on the first screen.');
  const p = formProbes(ctx, ruleId);
  if (!p.ok) return p.outcome;
  const fields = new Map(u.value.fields.map((f) => [f.id, f]));
  const errors = p.value.flatMap((pr) => pr.errors).filter((e) => e.text.length >= 3 && (e.errorish || e.fieldId || PROBLEM.test(e.text)));
  if (!errors.length) {
    const aborted = p.value.find((pr) => pr.aborted)?.aborted;
    return notEvaluated(
      ruleId,
      aborted
        ? `The form probe stopped early: ${aborted}.`
        : 'No error message appeared when fields were given invalid values and the form was asked to validate itself. The page may show errors only after a real submission, which the audit does not make.',
    );
  }
  const instances: Instance[] = [];
  for (const e of errors) {
    if (CORRECTIVE.test(e.text) || !PROBLEM.test(e.text)) continue;
    const field = e.fieldId ? fields.get(e.fieldId) : undefined;
    // The constraint already sits next to the field, before anything is submitted.
    if (field?.hint && CORRECTIVE.test(field.hint)) continue;
    const inst = atElement(
      e,
      `Error message ${q(e.text, 80)} states the problem without saying how to fix it`,
      'cause and correction in under 12 words, e.g. "Password needs at least 8 characters and one number"',
      { error_text: e.text, field_type: field?.type ?? 'unknown' },
      // "This field is required" at least implies the fix; "Invalid email" does not.
      { confidence: /required|blank|empty|missing/i.test(e.text) ? 0.72 : 0.86, rootCause: 'error-copy' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: errors.length };
  const rep = errors[0];
  return {
    ruleId,
    status: 'pass',
    checked: errors.length,
    note: `${plural(errors.length, 'error message')} the form showed say how to correct the value, e.g. ${q(rep.text, 60)}.`,
    evidence: elEvidence(rep, `error message ${q(rep.text, 60)}`, 'cause and correction'),
  };
};

const UX_005: Evaluator = (ctx) => {
  const ruleId = 'UX-005';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const long = actionForms(u.value).filter((f) => f.fields.length >= 4);
  if (!long.length) {
    return notApplicable(ruleId, actionForms(u.value).length ? 'The forms on the first screen have 3 or fewer fields.' : 'No form on the first screen.');
  }
  const p = formProbes(ctx, ruleId);
  if (!p.ok) return p.outcome;
  const instances: Instance[] = [];
  let passed: { selector: string; how: string; box: { x: number; y: number; w: number; h: number } } | null = null;
  const unknown: string[] = [];
  for (const form of long) {
    const pr = p.value.find((x) => x.formId === form.id);
    const tried = pr?.tried.filter((t) => !t.how?.startsWith('could not')) ?? [];
    if (!pr || !tried.length) {
      unknown.push(`${form.selector}: no field has a format or required constraint to test`);
      continue;
    }
    const reacted = tried.find((t) => t.reacted);
    if (reacted) {
      passed ??= { selector: form.selector, how: `${reacted.how} after ${reacted.tried}`, box: form.box };
      continue;
    }
    const validates = pr.errors.length > 0 || (pr.validity.invalid > 0 && !form.novalidate);
    if (!validates) {
      unknown.push(`${form.selector}: nothing reacted on blur, and the page's own submit-time validation can only be seen by submitting`);
      continue;
    }
    const inst = atElement(
      form,
      `No reaction on blur for ${plural(tried.length, 'field')} given invalid values (${tried.map((t) => t.tried).join('; ')}); ${
        pr.errors.length ? 'messages appeared only when the form was validated' : 'the browser reports the fields invalid only when the form is submitted'
      }`,
      'format errors shown when the user leaves the field',
      { form_selector: form.selector, field_count: form.fields.length, validation_timing: 'submit only — no reaction on blur' },
      { confidence: 0.82, rootCause: form.selector },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: long.length, note: unknown.join(' ') || undefined };
  if (passed) {
    return {
      ruleId,
      status: 'pass',
      checked: long.length,
      note: `The form validates as the user goes: ${passed.how}.`,
      evidence: elEvidence(passed, passed.how, 'validation on blur'),
    };
  }
  return notEvaluated(ruleId, unknown.join(' '));
};

const UX_006: Evaluator = (ctx) => {
  const ruleId = 'UX-006';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const long = actionForms(u.value).filter((f) => f.fields.length >= 6);
  if (!long.length) return notApplicable(ruleId, 'No form with 6 or more fields on the first screen.');
  return notEvaluated(
    ruleId,
    `${long[0].selector} has ${long[0].fields.length} fields, but where focus lands and whether a summary appears can only be seen after a real submission, which the audit does not make.`,
  );
};

const UX_007: Evaluator = (ctx) => {
  const ruleId = 'UX-007';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const d = u.value.destructive;
  if (!d.length) return notApplicable(ruleId, 'No delete, remove, cancel or clear control on the first screen.');
  return notEvaluated(
    ruleId,
    `${plural(d.length, 'destructive control')} on the first screen (${d.slice(0, 3).map((x) => q(x.label, 30)).join(', ')}). Seeing whether it confirms or offers undo means pressing it, which the audit does not do on a live site.`,
  );
};

/* ============================================================ flows */

const UX_008: Evaluator = (ctx) => {
  const ruleId = 'UX-008';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const step = u.value.steps.find((s) => s.n != null && s.total != null && s.total >= 2);
  if (!step) {
    return actionForms(u.value).length
      ? notEvaluated(ruleId, 'No step indicator on the first screen, so whether this is one step of a flow could only be seen by advancing it — which means submitting.')
      : notApplicable(ruleId, 'No multi-step flow on the first screen.');
  }
  if (step.n! >= step.total!) return notApplicable(ruleId, `This is the last step (${step.n} of ${step.total}), a terminal screen.`);
  const { backControls: back, closeControls: close, navLinksInView: nav } = u.value;
  if (back.length || close.length || nav >= 2) {
    const exits = [back.length && `back (${q(back[0].text, 20)})`, close.length && `close (${q(close[0].text, 20)})`, nav >= 2 && `${nav} navigation links`].filter(Boolean);
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `Step ${step.n} of ${step.total} offers a way out: ${exits.join(', ')}.`,
      evidence: elEvidence(step, `exits: ${exits.join(', ')}`, 'a back or close control'),
    };
  }
  const inst = atElement(
    step,
    `Step ${step.n} of ${step.total} has no back control, no close control and no navigation links`,
    'a back control that keeps entered values, and a close control that saves or warns',
    { step_selector: step.selector, available_controls: u.value.interactiveInView.map((i) => i.label).slice(0, 15) },
    { confidence: 0.88, rootCause: 'no-exit' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: 1 } : notEvaluated(ruleId, 'The step indicator is outside the first screen.');
};

const UX_009: Evaluator = (ctx) => {
  const ruleId = 'UX-009';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const step = u.value.steps[0];
  if (step) {
    const what = step.kind === 'progressbar' ? 'a progress bar' : `"Step ${step.n} of ${step.total}"`;
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The flow shows where the user is: ${what}.`,
      evidence: elEvidence(step, what, 'a step indicator', { step_count: step.total ?? 'progress bar' }),
    };
  }
  return actionForms(u.value).length
    ? notEvaluated(ruleId, 'No step indicator on the first screen. Whether the flow has three or more steps can only be seen by advancing it, which means submitting.')
    : notApplicable(ruleId, 'No multi-step flow on the first screen.');
};

/* ============================================================ empty */

const UX_010: Evaluator = (ctx) => {
  const ruleId = 'UX-010';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const empties = u.value.empties.filter((e) => !e.loading);
  if (!empties.length) return notApplicable(ruleId, 'No empty container on the first screen.');
  const instances: Instance[] = [];
  for (const e of empties) {
    if (u.value.clearFilter) continue; // an empty result after a filter, with a way to clear it
    const missing = [!e.hasAction && 'no action', e.explanation.length < 20 && 'no explanation'].filter(Boolean) as string[];
    if (!missing.length) continue;
    const inst = atElement(
      e.container,
      `Empty state ${q(e.message, 60)} with ${missing.join(' and ')}`,
      'a line saying what lives here, the action that fills it as a primary button, and one supporting line',
      { container_content: [e.message, e.explanation].filter(Boolean).join(' — ').slice(0, 200) },
      { confidence: 0.85, rootCause: 'empty-state' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: empties.length };
  const rep = empties[0];
  return {
    ruleId,
    status: 'pass',
    checked: empties.length,
    note: `The empty state ${q(rep.message, 40)} explains itself and offers an action.`,
    evidence: elEvidence(rep.container, `${q(rep.message, 40)} with an action`, 'explanation and action'),
  };
};

/* ============================================================== auth */

const UX_011: Evaluator = (ctx) => {
  const ruleId = 'UX-011';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  if (ctx.pageType.type !== 'landing') {
    return notEvaluated(ruleId, 'Whether any value was reachable before this page needs the path that led here, and the audit reads one page.');
  }
  if (u.value.accountBound) return notApplicable(ruleId, 'The product reads as inherently account-bound (banking, mail or health records).');
  const conv = u.value.ctas.filter((c) => c.conversion);
  if (!conv.length) return notApplicable(ruleId, 'No call to action on the first screen to trace.');
  const auth = u.value.authLinks;
  const open = conv.filter((c) => !auth.some((a) => a.selector === c.selector));
  if (open.length || u.value.demoPaths.length || u.value.valueForms.length) {
    const how = u.value.valueForms.length
      ? 'a form on the first screen does something without an account'
      : u.value.demoPaths.length
        ? `a demo or sample is linked (${q(u.value.demoPaths[0], 40)})`
        : `${q(open[0].label, 40)} does not lead to a sign-up or login page`;
    const rep = open[0] ?? conv[0];
    return {
      ruleId,
      status: 'pass',
      checked: conv.length,
      note: `Visitors can see value before an account: ${how}.`,
      evidence: elEvidence(rep, how, 'value reachable without an account'),
    };
  }
  const box = union(conv.map((c) => c.box));
  const inst = box
    ? atElement(
        { selector: conv.map((c) => c.selector).join(', '), box },
        `Every call to action on the first screen leads to an account wall (${auth.map((a) => `${q(a.label, 30)} → ${a.href}`).join('; ')}), and no demo, sample or preview is linked`,
        'one complete result, sample or demo reachable without an account',
        { flow_trace: auth.map((a) => `${a.label} → ${a.href}`), auth_wall_url: auth[0].href },
        // Whether the product is inherently account-bound is a judgement the page cannot settle.
        { confidence: 0.72, rootCause: 'auth-wall' },
      )
    : null;
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: conv.length } : notEvaluated(ruleId, 'The calls to action are outside the first screen.');
};

/* ======================================================== form fields */

const EXTRAS: Record<string, [RegExp, string][]> = {
  newsletter: [
    [/phone|mobile|\btel\b/i, 'a phone number'],
    [/company|organi[sz]ation|business/i, 'a company name'],
    [/job|title|role|position/i, 'a job title'],
    [/address|street|city|zip|postal|country/i, 'an address'],
    [/birth|dob|\bage\b/i, 'a date of birth'],
    [/gender|\bsex\b/i, 'a gender'],
  ],
  signup: [
    [/phone|mobile|\btel\b/i, 'a phone number'],
    [/company|organi[sz]ation/i, 'a company name'],
    [/job|title|role|position/i, 'a job title'],
    [/address|street|city|zip|postal/i, 'an address'],
    [/birth|dob|\bage\b/i, 'a date of birth'],
    [/gender|\bsex\b/i, 'a gender'],
    [/hear about|how did you|referr?al source/i, 'how they heard about you'],
    [/website|\burl\b/i, 'a website'],
  ],
  contact: [
    [/birth|dob|\bage\b/i, 'a date of birth'],
    [/gender|\bsex\b/i, 'a gender'],
    [/address|street|zip|postal/i, 'an address'],
    [/hear about|how did you/i, 'how they heard about you'],
    [/job|title|position/i, 'a job title'],
  ],
  checkout: [
    [/birth|dob/i, 'a date of birth'],
    [/gender|\bsex\b/i, 'a gender'],
    [/hear about|how did you/i, 'how they heard about you'],
    [/job title|position/i, 'a job title'],
  ],
  onboarding: [
    [/phone|mobile|\btel\b/i, 'a phone number'],
    [/birth|dob/i, 'a date of birth'],
    [/gender|\bsex\b/i, 'a gender'],
    [/address|street|zip|postal/i, 'an address'],
    [/hear about|how did you/i, 'how they heard about you'],
  ],
};
const TASK_WORDS: Record<string, string> = {
  newsletter: 'subscribe to a newsletter',
  signup: 'create an account',
  contact: 'send a message',
  checkout: 'pay for an order',
  onboarding: 'get started',
};
const REASON = /\b(we('ll| will)?|so (that )?we|to (help|send|contact|verify|deliver|reach)|used (to|for)|why|because|only (to|for))\b/i;

const UX_012: Evaluator = (ctx) => {
  const ruleId = 'UX-012';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const forms = actionForms(u.value);
  if (!forms.length) return notApplicable(ruleId, 'No form on the first screen.');
  const instances: Instance[] = [];
  for (const form of forms) {
    const words = [form.submitText, form.heading, form.context].join(' ');
    const task = form.hasPayment
      ? 'checkout'
      : form.hasPassword
        ? 'signup'
        : form.fields.length <= 3 && form.fields.some((f) => f.type === 'email') && /subscribe|newsletter|updates|notify|join/i.test(words)
          ? 'newsletter'
          : form.hasTextarea
            ? 'contact'
            : ctx.pageType.type in EXTRAS
              ? ctx.pageType.type
              : null;
    if (!task) continue;
    const extras = form.fields.flatMap((f) => {
      if (!(f.required || f.requiredMarker)) return [];
      const key = [f.nameAttr, f.visibleLabel, f.placeholder, f.type === 'tel' ? 'phone' : ''].join(' ');
      const hit = EXTRAS[task].find(([re]) => re.test(key));
      if (!hit || REASON.test(f.hint)) return [];
      return [{ f, what: hit[1] }];
    });
    if (extras.length < 2) continue;
    for (const { f, what } of extras) {
      const inst = atElement(
        f,
        `${q(fieldName(f), 40)} is required to ${TASK_WORDS[task]}, with no line saying why`,
        'only the fields the task needs are required, or a line of microcopy saying why',
        {
          form_selector: form.selector,
          field_list: form.fields.map(fieldName),
          required_flags: form.fields.map((x) => `${fieldName(x)}: ${x.required || x.requiredMarker ? 'required' : 'optional'}`),
          task_context: `${task} form, submitted with ${q(form.submitText || 'no label', 30)}`,
        },
        {
          confidence: 0.78,
          rootCause: form.selector,
          signals: [`marked required${f.required ? ' in the markup' : ' with a marker'}, with no stated reason`, `${what} is not needed to ${TASK_WORDS[task]}`],
        },
      );
      if (inst) instances.push(inst);
    }
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: forms.length };
  const rep = forms[0];
  return {
    ruleId,
    status: 'pass',
    checked: forms.length,
    note: `The form asks only for what its task needs (${rep.fields.map(fieldName).slice(0, 4).join(', ')}).`,
    evidence: elEvidence(rep, `${plural(rep.fields.length, 'field')}: ${rep.fields.map(fieldName).slice(0, 4).join(', ')}`, 'only task-relevant fields required'),
  };
};

const UX_013: Evaluator = (ctx) => {
  const ruleId = 'UX-013';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const forms = actionForms(u.value).filter((f) => f.fields.length >= 2);
  if (!forms.length) return notApplicable(ruleId, 'No form with two or more fields on the first screen.');
  const instances: Instance[] = [];
  let checked = 0;
  let passed: (typeof forms)[number] | null = null;
  for (const form of forms) {
    const req = form.fields.filter((f) => f.required);
    const opt = form.fields.filter((f) => !f.required);
    // With no field marked required in the markup, which ones are required cannot be read.
    if (!req.length) continue;
    checked += 1;
    if (!opt.length || req.every((f) => f.requiredMarker) || opt.every((f) => f.optionalMarker)) {
      passed ??= form;
      continue;
    }
    const inst = atElement(
      form,
      `${plural(req.length, 'required field')} and ${plural(opt.length, 'optional field')}; ${req.filter((f) => f.requiredMarker).length} of the required and ${opt.filter((f) => f.optionalMarker).length} of the optional are marked`,
      'one group marked consistently — "(optional)" on the minority',
      {
        form_selector: form.selector,
        required_map: form.fields.map((f) => `${fieldName(f)}: ${f.required ? 'required' : 'optional'}${f.requiredMarker ? ' (marked)' : f.optionalMarker ? ' (marked optional)' : ''}`),
      },
      { confidence: 0.86, rootCause: form.selector },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked };
  if (passed) {
    return {
      ruleId,
      status: 'pass',
      checked,
      note: `Required and optional fields are told apart in ${passed.selector}.`,
      evidence: elEvidence(passed, 'required and optional fields distinguished', 'a consistent marker'),
    };
  }
  return notEvaluated(ruleId, 'The forms mark no field as required in their markup, so which fields are required could not be read.');
};

const UX_014: Evaluator = (ctx) => {
  const ruleId = 'UX-014';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const withPlaceholder = u.value.fields.filter((f) => f.placeholder && !f.honeypot && f.inView);
  if (!withPlaceholder.length) return notApplicable(ruleId, 'No field with placeholder text on the first screen.');
  const instances: Instance[] = [];
  for (const f of withPlaceholder) {
    if (f.visibleLabel) continue;
    if (f.inSearch && f.searchIcon && f.ariaLabel) continue;
    if (f.siblings === 1) continue; // a single-field form, where context carries the meaning
    const inst = atElement(
      f,
      `Placeholder ${q(f.placeholder, 50)} is the only visible label`,
      'a persistent visible label above the field',
      { placeholder_text: f.placeholder },
      { confidence: 0.92, rootCause: 'placeholder-labels', defect: `label:${f.selector}` },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: withPlaceholder.length };
  const rep = withPlaceholder.find((f) => f.visibleLabel) ?? withPlaceholder[0];
  return {
    ruleId,
    status: 'pass',
    checked: withPlaceholder.length,
    note: rep.visibleLabel
      ? `Fields keep a visible label while typing, e.g. ${q(rep.visibleLabel, 40)}.`
      : 'The only placeholder-labelled fields sit alone in their form, where the context names them.',
    evidence: elEvidence(rep, rep.visibleLabel ? `label ${q(rep.visibleLabel, 40)}` : 'single-field form', 'a persistent label', { placeholder_text: rep.placeholder }),
  };
};

/* ========================================================= navigation */

const UX_015: Evaluator = (ctx) => {
  const ruleId = 'UX-015';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const navs = u.value.navs;
  if (!navs.length) return notApplicable(ruleId, 'No navigation on the first screen.');
  if (navs.every((n) => n.singlePage)) return notApplicable(ruleId, 'Every navigation link points within this page — a single page with no route changes.');
  const instances: Instance[] = [];
  let marked: { item: (typeof navs)[number]['items'][number]; how: string } | null = null;
  let matched = 0;
  for (const n of navs) {
    for (const item of n.items.filter((i) => i.matches)) {
      matched += 1;
      const others = n.items.filter((i) => i !== item);
      const counts = new Map<string, number>();
      for (const o of others) counts.set(o.look, (counts.get(o.look) ?? 0) + 1);
      const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const aria = item.ariaCurrent && item.ariaCurrent !== 'false';
      const styled = common != null && item.look !== common;
      if (aria || styled) {
        marked ??= { item, how: aria ? `aria-current="${item.ariaCurrent}"` : 'a distinct active style' };
        continue;
      }
      if (common == null) continue;
      const inst = atElement(
        item,
        `${q(item.text, 30)} links to this page but looks like every other item and has no aria-current`,
        'an active style and aria-current="page" on the current item',
        {
          nav_selector: n.nav.selector,
          current_url: u.value.url,
          active_state_map: n.items.map((i) => `${i.text || i.href}: ${i.matches ? 'current' : 'other'}, aria-current ${i.ariaCurrent ?? 'none'}`),
        },
        { confidence: 0.88, rootCause: n.nav.selector },
      );
      if (inst) instances.push(inst);
    }
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: matched };
  if (marked) {
    return {
      ruleId,
      status: 'pass',
      checked: matched,
      note: `The navigation marks the current page: ${q(marked.item.text, 30)} has ${marked.how}.`,
      evidence: elEvidence(marked.item, marked.how, 'the current item marked'),
    };
  }
  return notApplicable(ruleId, `No navigation item points at this page (${u.value.url}), so there is no item to mark.`);
};

const UX_017: Evaluator = (ctx) => {
  const ruleId = 'UX-017';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const lists = u.value.lists;
  if (!lists.length) return notApplicable(ruleId, 'No list of more than 25 items starts on the first screen.');
  if (u.value.searchControls.length) {
    return {
      ruleId,
      status: 'pass',
      checked: lists.length,
      note: `A list of ${lists[0].count} items has a search or filter control (${u.value.searchControls[0]}).`,
      evidence: elEvidence(lists[0], `${lists[0].count} items, with search or filter`, 'a search or filter control'),
    };
  }
  const instances: Instance[] = [];
  for (const l of lists) {
    if (l.sorted) continue; // ordered alphabetically: the user already knows where to look
    const inst = atElement(
      l,
      `${l.count} items (${l.sample.slice(0, 3).map((s) => q(s, 24)).join(', ')}…) with no search or filter control on the page`,
      'a search input above the list, plus filters for the one or two attributes users sort by',
      { container_selector: l.selector, item_count: l.count, control_map: 'no search, filter or sort control found' },
      // Pagination with category navigation is an exclusion the page only half shows.
      { confidence: u.value.pagination ? 0.7 : 0.88, rootCause: l.selector },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: lists.length };
  return notApplicable(ruleId, 'The long lists on the first screen are in alphabetical order.');
};

/* ============================================================== toasts */

const UX_020: Evaluator = (ctx) => {
  const ruleId = 'UX-020';
  if (!ctx.measured) return notEvaluated(ruleId, ctx.noBrowser ?? 'No browser was available to render the page.');
  const t = ctx.measured.toasts;
  if (!t.ok) return notEvaluated(ruleId, `Messages could not be watched: ${t.error}`);
  const dismissed = t.value.records.filter((r) => r.hiddenAt != null);
  if (!dismissed.length) {
    return notEvaluated(
      ruleId,
      t.value.records.length
        ? `${plural(t.value.records.length, 'message')} appeared and stayed while the page was watched; none dismissed itself.`
        : 'No message appeared and dismissed itself while the page was watched. The actions that usually trigger toasts were not taken.',
    );
  }
  const instances: Instance[] = [];
  for (const r of dismissed) {
    const ms = r.hiddenAt! - r.shownAt;
    const needed = r.words * 300 + 1000;
    if (ms >= needed) continue;
    const persistent = t.value.persistentText.includes(r.text.slice(0, 60));
    if (persistent) continue;
    const inst = atElement(
      r,
      `${q(r.text, 60)} (${r.words} words) disappeared after ${ms}ms`,
      `at least ${needed}ms for ${r.words} words, and no less than 5s`,
      { message_text: r.text, dismiss_ms: ms, word_count: r.words },
      // Whether it pauses on hover could not be tested: it was gone.
      { confidence: 0.78, rootCause: r.selector },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: dismissed.length, note: 'Whether each message pauses on hover or focus was not tested.' };
  const rep = dismissed[0];
  return {
    ruleId,
    status: 'pass',
    checked: dismissed.length,
    note: `Messages that dismiss themselves stay long enough to read (${q(rep.text, 40)} stayed ${rep.hiddenAt! - rep.shownAt}ms).`,
    evidence: elEvidence(rep, `stayed ${rep.hiddenAt! - rep.shownAt}ms`, 'readable duration'),
  };
};

/* ============================================================= buttons */

const CONSEQUENCE = /\b(delete|remove|pay|buy|purchase|subscribe|cancel|place (your )?order|send|transfer|confirm (your )?(order|purchase|payment|subscription)|upgrade|downgrade|deactivate|unsubscribe)\b/i;

const UX_021: Evaluator = (ctx) => {
  const ruleId = 'UX-021';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const generic = u.value.generic;
  if (!generic.length) return notApplicable(ruleId, 'No button labelled OK, Submit, Continue, Yes, No or Confirm on the first screen.');
  const stakes = generic.filter((g) => g.commercial || g.destructive);
  if (!stakes.length) return notApplicable(ruleId, `Generic labels (${generic.map((g) => q(g.label, 12)).join(', ')}) appear only on actions that are neither commercial nor destructive.`);
  const instances: Instance[] = [];
  for (const g of stakes) {
    if (CONSEQUENCE.test(g.heading)) continue;
    const inst = atElement(
      g,
      `Button reads ${q(g.label, 20)} on a ${g.destructive ? 'destructive' : 'commercial'} action; ${g.heading ? `the heading ${q(g.heading, 50)} does not state the consequence` : 'no heading states the consequence'}`,
      'a label naming the action, e.g. "Pay $49" or "Delete 3 files"',
      { button_text: g.label, dialog_context: `${g.container}: ${g.context.slice(0, 160)}` },
      { confidence: 0.82, rootCause: 'generic-verbs' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: stakes.length };
  const rep = stakes[0];
  return {
    ruleId,
    status: 'pass',
    checked: stakes.length,
    note: `Where a generic label is used, the heading states the consequence (${q(rep.heading, 40)}).`,
    evidence: elEvidence(rep, `heading ${q(rep.heading, 40)}`, 'the consequence stated'),
  };
};

/* ================================================================ text */

const UX_022: Evaluator = (ctx) => {
  const ruleId = 'UX-022';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  if (u.value.legal) return notApplicable(ruleId, 'This is a legal document (terms or privacy), which the rule excludes.');
  const ps = u.value.paragraphs;
  if (!ps.length && !u.value.runs.length) return notApplicable(ruleId, 'No body text on the first screen.');
  const map = ps.slice(0, 10).map((p) => `${p.selector}: ${p.lines} lines`);
  const counts = ps.slice(0, 10).map((p) => p.lines);
  const instances: Instance[] = [];
  for (const p of ps.filter((x) => x.lines > 6)) {
    const inst = atElement(
      p,
      `A paragraph of ${p.lines} lines at ${p.width}px wide`,
      'no paragraph longer than 6 lines; 4 is the target',
      { paragraph_map: map, line_counts: counts },
      { confidence: 0.9, rootCause: 'long-paragraphs' },
    );
    if (inst) instances.push(inst);
  }
  for (const r of u.value.runs) {
    const inst = atElement(
      { selector: r.selectors.join(', '), box: r.box },
      `${r.count} consecutive paragraphs with no heading, list or media between them`,
      'a subheading every 3 to 4 paragraphs',
      { paragraph_map: r.selectors.slice(0, 10), line_counts: counts },
      { confidence: 0.88, rootCause: 'paragraph-run' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: ps.length };
  const longest = Math.max(...ps.map((p) => p.lines));
  const rep = ps.find((p) => p.lines === longest)!;
  return {
    ruleId,
    status: 'pass',
    checked: ps.length,
    note: `Body text is broken up: the longest of ${plural(ps.length, 'paragraph')} on the first screen runs ${plural(longest, 'line')}.`,
    evidence: elEvidence(rep, `${longest} lines`, 'at most 6 lines', { paragraph_map: map, line_counts: counts }),
  };
};

const UX_023: Evaluator = (ctx) => {
  const ruleId = 'UX-023';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  // Body text: lead and display copy above 24px is set to a different measure on purpose.
  const ps = u.value.paragraphs.filter((p) => p.lines >= 2 && p.fontSize <= 24);
  if (!ps.length) return notApplicable(ruleId, 'No body text (24px or smaller) on the first screen wraps onto a second line.');
  const instances: Instance[] = [];
  for (const p of ps) {
    const wide = p.ch > 90;
    const narrow = p.ch < 45 && p.lines >= 3;
    if (!wide && !narrow) continue;
    const inst = atElement(
      p,
      `${p.ch} characters per line (${p.width}px wide at ${p.fontSize}px)`,
      'between 45 and 90 characters per line',
      { computed_ch: p.ch, container_width: p.width },
      { confidence: 0.88, rootCause: `${wide ? 'wide' : 'narrow'}-${Math.round(p.width / 20) * 20}px` },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: ps.length };
  const lo = Math.min(...ps.map((p) => p.ch));
  const hi = Math.max(...ps.map((p) => p.ch));
  return {
    ruleId,
    status: 'pass',
    checked: ps.length,
    note: `Body text runs ${lo === hi ? lo : `${lo}–${hi}`} characters per line, inside the readable range.`,
    evidence: elEvidence(ps[0], `${ps[0].ch}ch at ${ps[0].width}px`, '45–90ch', { computed_ch: ps[0].ch, container_width: ps[0].width }),
  };
};

/* =============================================================== hover */

const UX_025: Evaluator = (ctx) => {
  const ruleId = 'UX-025';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const { reveals, readable, unreadable } = u.value.hover;
  if (!readable) {
    return notEvaluated(ruleId, unreadable ? `All ${plural(unreadable, 'stylesheet')} are cross-origin, so their hover rules could not be read.` : 'The page has no stylesheets to read.');
  }
  const caveat = [
    'Only 1440×900 is rendered, so whether each trigger is still shown at 1024px or below was not seen.',
    unreadable ? `${plural(unreadable, 'cross-origin stylesheet')} could not be read.` : '',
  ].filter(Boolean).join(' ');
  const instances: Instance[] = [];
  for (const r of reveals.filter((x) => !x.touchEquivalent)) {
    // A button, aria-expanded or aria-haspopup suggests a script toggle the stylesheet cannot show.
    const confidence = r.duplicated ? 0.7 : r.toggleHint || r.inNav ? 0.8 : 0.88;
    const inst = atElement(
      r.trigger,
      `${r.revealedText ? q(r.revealedText, 60) : 'Links'} shown only on hover (${r.target})`,
      'the same content reachable by click, tap or focus',
      { hover_styles: r.rule, touch_equivalent_present: false },
      { confidence, rootCause: r.trigger.selector },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: reveals.length, note: caveat };
  return {
    ruleId,
    status: 'pass',
    checked: readable,
    note: `${plural(readable, 'stylesheet')} read; nothing on the first screen is revealed by hover without a focus or click equivalent.${unreadable ? ` ${caveat}` : ''}`,
    evidence: docEvidence('style, link[rel="stylesheet"]', 'no hover-only reveal', 'a focus or click equivalent for every hover reveal'),
  };
};

/* =============================================================== modal */

const UX_026: Evaluator = (ctx) => {
  const ruleId = 'UX-026';
  const u = ux(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const m = u.value.modal;
  if (!m) return notApplicable(ruleId, 'No modal open on the first screen.');
  const p = ctx.measured!.modal;
  if (m.closeControls.length) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The open dialog has a close control (${q(m.closeControls[0], 20)}).`,
      evidence: elEvidence(m, `close control ${q(m.closeControls[0], 20)}`, 'a way to dismiss'),
    };
  }
  if (!p || !p.ok) return notEvaluated(ruleId, `The dialog's dismiss behaviour could not be tested${p && !p.ok ? `: ${p.error}` : ''}.`);
  if (p.value.escape || p.value.backdrop) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The open dialog can be dismissed: ${p.value.note}`,
      evidence: elEvidence(m, p.value.note, 'a way to dismiss'),
    };
  }
  if (m.blocking && m.declinePath.length) {
    return notApplicable(ruleId, `A required decision (${m.name || 'consent or age check'}) with an explicit decline path (${q(m.declinePath[0], 20)}).`);
  }
  const inst = atElement(
    m,
    `An open ${m.kind} with no close control. ${p.value.note}`,
    'a close button in the top corner, backdrop click to dismiss, and Escape',
    {
      dismiss_handlers: `close control: none; Escape: does nothing; backdrop click: ${p.value.backdrop === null ? 'no backdrop' : 'does nothing'}`,
    },
    { confidence: 0.93, rootCause: 'modal-dismiss' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: 1 } : notEvaluated(ruleId, 'The dialog is outside the first screen.');
};

/* ================================================================ export */

export const UX_EVALUATORS: Record<string, Evaluator> = {
  'UX-001': UX_001,
  'UX-002': UX_002,
  'UX-003': cannot(
    'UX-003',
    "Measuring feedback means activating the page's controls — submitting its forms or pressing its buttons — and the audit does not do that on a site it doesn't own.",
  ),
  'UX-004': UX_004,
  'UX-005': UX_005,
  'UX-006': UX_006,
  'UX-007': UX_007,
  'UX-008': UX_008,
  'UX-009': UX_009,
  'UX-010': UX_010,
  'UX-011': UX_011,
  'UX-012': UX_012,
  'UX-013': UX_013,
  'UX-014': UX_014,
  'UX-015': UX_015,
  'UX-016': cannot('UX-016', "The shortest path to the page's key task needs a crawl of the site; the audit reads one page."),
  'UX-017': UX_017,
  'UX-018': cannot('UX-018', 'Where each cost first appears needs every checkout step traced to the end, which means placing an order.'),
  'UX-019': cannot('UX-019', 'Whether entered values survive needs navigating away and back mid-flow, which the audit does not do on a live site.'),
  'UX-020': UX_020,
  'UX-021': UX_021,
  'UX-022': UX_022,
  'UX-023': UX_023,
  'UX-024': cannot('UX-024', 'Comparing how one task is built across pages needs more than one page; the audit reads one.'),
  'UX-025': UX_025,
  'UX-026': UX_026,
};
