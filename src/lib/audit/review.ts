import Anthropic from '@anthropic-ai/sdk';
import { check as checkOf, criterion as criterionOf } from './catalog';
import {
  BANNED_PHRASES,
  PAGE_TYPES,
  SEVERITY_ORDER,
  worse,
  type ContractFinding,
  type PageType,
  type PageTypeResult,
  type SeverityLevel,
  type WorkingItem,
} from './contract';
import type { DocFacts } from './document';
import type { Evaluation } from './evaluate';

/**
 * L3 — the model. Read-only on L1 and L2.
 *
 * It classifies the page before any rule runs, and afterwards it may filter
 * false positives, adjust severity by one step, lower confidence, merge findings
 * that share a root cause, and write the prose. It may not create a finding:
 * there is no field in its output that could hold one.
 *
 * Nothing it returns is trusted. Every edit is checked here — confidence may
 * only fall, severity may move one step, and any sentence carrying a banned
 * phrase, heuristic jargon, or a number that is not in the evidence is thrown
 * away in favour of the catalog's own text.
 */

export const MODEL = 'claude-opus-5';

export class ModelSkipped extends Error {}

export function modelAvailable(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic({ maxRetries: 2, timeout: 90_000 });
  return client;
}

/**
 * One structured call. The schema constrains the reply, and server-side
 * fallbacks re-run a declined request on another model rather than failing it.
 */
export async function ask<T>(
  system: string,
  user: string | Anthropic.Beta.Messages.BetaContentBlockParam[],
  schema: Record<string, unknown>,
  effort: 'low' | 'medium' | 'high',
  maxTokens: number,
): Promise<T> {
  if (!modelAvailable()) throw new ModelSkipped('ANTHROPIC_API_KEY is not configured');
  const res = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort, format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (res.stop_reason === 'refusal') throw new Error('the model declined to review this page');
  if (res.stop_reason === 'max_tokens') throw new Error('the review ran out of room before finishing');
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return JSON.parse(text) as T;
}

/** A short reason for a failed call, without leaking internals to the page. */
export function describeModelError(err: unknown): string {
  if (err instanceof ModelSkipped) return err.message;
  if (err instanceof Anthropic.AuthenticationError) return 'the API key was rejected';
  if (err instanceof Anthropic.RateLimitError) return 'the model is rate limited right now';
  if (err instanceof Anthropic.BadRequestError) return 'the model rejected the request';
  if (err instanceof Anthropic.APIConnectionError) return 'the model could not be reached';
  if (err instanceof Anthropic.APIError) return `the model returned an error (${err.status ?? 'unknown'})`;
  if (err instanceof SyntaxError) return 'the model’s reply was not readable';
  return err instanceof Error ? err.message : String(err);
}

/* ======================================================== classification */

const CLASSIFY_SYSTEM = `You classify one web page into exactly one page type, from measured facts about it.
Choose "unknown" when the facts do not clearly support one type. A wrong type makes the audit run the wrong rules, so prefer "unknown" to a guess.
Confidence is 0 to 1. Answer in the JSON schema only.`;

export async function classifyWithModel(doc: DocFacts, signals: PageTypeResult): Promise<PageTypeResult | null> {
  const facts = {
    url: doc.url,
    path: doc.path,
    http_status: doc.status,
    title: doc.title,
    h1: doc.h1Values.slice(0, 3),
    headings: doc.headings.slice(0, 15).map((h) => `h${h.level} ${h.text}`),
    calls_to_action: doc.ctaLabels,
    forms: doc.forms,
    fields: { inputs: doc.inputs, password: doc.passwordFields, email: doc.emailFields, textarea: doc.textareas, payment: doc.paymentFields },
    price_mentions: doc.priceMentions,
    plan_cards: doc.planCards,
    add_to_cart_controls: doc.addToCart,
    schema_org_types: doc.jsonLdTypes,
    articles: doc.articles,
    code_blocks: doc.codeBlocks,
    repeated_linked_cards: doc.repeatedCards,
    word_count: doc.wordCount,
    first_words: doc.bodyText.slice(0, 1500),
    signal_classifier: { type: signals.type, confidence: signals.confidence, because: signals.signals },
  };
  const schema = {
    type: 'object',
    properties: {
      page_type: { type: 'string', enum: [...PAGE_TYPES] },
      confidence: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['page_type', 'confidence', 'reason'],
    additionalProperties: false,
  };
  const out = await ask<{ page_type: string; confidence: number; reason: string }>(
    CLASSIFY_SYSTEM,
    JSON.stringify(facts, null, 1),
    schema,
    'low',
    4000,
  );
  if (!PAGE_TYPES.includes(out.page_type as PageType)) return null;
  const confidence = Math.max(0, Math.min(1, Number(out.confidence) || 0));
  if (out.page_type === 'unknown' || confidence < 0.6) return null;
  return {
    type: out.page_type as PageType,
    confidence: Math.round(confidence * 100) / 100,
    source: 'llm',
    signals: [String(out.reason).slice(0, 300)],
    signalsGuess: { type: signals.type, confidence: signals.confidence },
  };
}

/* ================================================================ review */

const REVIEW_SYSTEM = `You are the senior auditor reviewing an automated UX audit of one web page before it goes to the client. Every finding was produced by a measurement and carries evidence, and names the criterion it fails and the standard behind it.

You may:
- mark a finding as a likely false positive, with the specific reason in the evidence;
- lower a finding's confidence when its evidence is ambiguous (never raise it);
- move severity by at most one step from the rule's base, applying severity = impact x affected scope x certainty, with the reason;
- propose merging findings of the same rule that share one root cause;
- rewrite the rationale and the fix.

Findings whose criterion has method "assisted" are candidates whose verdict depends on reading wording or intent (error copy, button labels, which fields a task needs, which element dominates a region). Judge each against its pass_condition and do_not_fire_when, and mark it a false positive when the copy or context satisfies the criterion. One you leave standing is confirmed by your review.

You may not create findings, and you may not state any number, percentage, benchmark, metric or competitor claim that does not appear in the evidence you are given.

Write the way an experienced auditor writes for a client who is paying for this: specific, unhedged, and about their product rather than about design in general.
- Rationale is the consequence for this page's users and this business ("people cannot tell which field failed, so they resubmit the form and call support"), not a standard or a heuristic name. Never cite WCAG numbers, Nielsen heuristics or laws — the criterion already carries the reference.
- Every fix names the element and the exact change: a value, a copy string, or a spec. Use the evidence's selector or element text to name it.
- No throat-clearing, no "it is important to", no "consider", no "may want to". Say what is wrong and what to do.
- Never write: "improve UX", "make it more intuitive", "enhance the user experience", "consider optimizing", "best practices suggest".
- If you have nothing better than the given text, return it unchanged.
Answer in the JSON schema only.`;

export type ReviewReply = {
  findings: {
    id: string;
    false_positive: boolean;
    false_positive_reason: string;
    confidence: number;
    confidence_reason: string;
    severity: SeverityLevel;
    severity_reason: string;
    rationale: string;
    fix: string;
  }[];
  merges: { ids: string[] }[];
  summary: string;
  what_is_working: { evidence_id: string; text: string }[];
};

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          false_positive: { type: 'boolean' },
          false_positive_reason: { type: 'string' },
          confidence: { type: 'number' },
          confidence_reason: { type: 'string' },
          severity: { type: 'string', enum: [...SEVERITY_ORDER] },
          severity_reason: { type: 'string' },
          rationale: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['id', 'false_positive', 'false_positive_reason', 'confidence', 'confidence_reason', 'severity', 'severity_reason', 'rationale', 'fix'],
        additionalProperties: false,
      },
    },
    merges: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        required: ['ids'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
    what_is_working: {
      type: 'array',
      items: {
        type: 'object',
        properties: { evidence_id: { type: 'string' }, text: { type: 'string' } },
        required: ['evidence_id', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['findings', 'merges', 'summary', 'what_is_working'],
  additionalProperties: false,
};

/* ----------------------------------------------------------- validators */

/**
 * The numbers a sentence states. A ratio's ":1" is notation rather than a
 * claim, and a percentage keeps its sign — "40%" is only allowed if the
 * evidence says "40%", not merely because a 40px box appears somewhere.
 */
const numbersIn = (s: string) =>
  (s.replace(/(\d+(?:\.\d+)?)\s*:\s*1\b/g, '$1').match(/\d+(?:\.\d+)?%?/g) || []).map((n) =>
    n.endsWith('%') ? `${Number(n.slice(0, -1))}%` : String(Number(n)),
  );

/** What the evidence actually says — not its coordinates or selectors. */
const said = (evidence: ContractFinding['evidence']) =>
  evidence.map((e) => ({ observed: e.observed, expected: e.expected, fields: withoutCaptures(e.fields) }));

/** Probe captures are images, not claims — and their base64 is full of digits. */
const withoutCaptures = (fields: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => !(typeof v === 'string' && v.startsWith('data:image/'))));

/** Why a sentence the model wrote is unusable, or null if it passes. */
export function proseProblem(text: string, allowedNumbers: Set<string>, { rationale = false } = {}): string | null {
  const t = (text || '').trim();
  if (!t) return 'empty';
  const lower = t.toLowerCase();
  const banned = BANNED_PHRASES.find((p) => lower.includes(p));
  if (banned) return `uses the banned phrase "${banned}"`;
  if (rationale && /\bnielsen\b|\bheuristic\b|\bwcag\b|success criterion|\blaw\b/i.test(t)) return 'uses heuristic jargon';
  const stray = numbersIn(t).find((n) => !allowedNumbers.has(n));
  if (stray) return `states ${stray}, which is not in the evidence`;
  return null;
}

/** A fix must point at the element and say what to change it to. */
export function fixProblem(fix: string, f: ContractFinding): string | null {
  const t = (fix || '').trim();
  if (!t) return 'empty';
  const hooks = new Set<string>();
  for (const e of f.evidence) {
    const tail = e.selector.split(/\s*>\s*/).pop() ?? '';
    hooks.add(tail.replace(/:nth-of-type\(\d+\)/, ''));
    tail.split(/[#.]/).filter((x) => x.length > 2).forEach((x) => hooks.add(x));
    for (const v of Object.values(e.fields)) if (typeof v === 'string' && v.length >= 3 && v.length <= 60) hooks.add(v);
  }
  const lower = t.toLowerCase();
  const names = [...hooks].some((h) => h && lower.includes(h.toLowerCase()));
  const tag = /<\w+|\b(button|link|input|field|heading|image|img|h[1-6]|title|html|meta|nav|main|label|video|audio)\b/i.test(t);
  if (!names && !tag) return 'does not name the element';
  if (!/#[0-9a-f]{3,8}\b|\d+(\.\d+)?(px|:1|ms|s\b)|["'`<]|=|\b(h[1-6])\b/i.test(t)) return 'does not state the exact change';
  return null;
}

function allowed(...sources: unknown[]): Set<string> {
  const set = new Set<string>();
  for (const s of sources) for (const n of numbersIn(JSON.stringify(s))) set.add(n);
  return set;
}

function shiftOk(base: SeverityLevel, next: SeverityLevel): boolean {
  return Math.abs(SEVERITY_ORDER.indexOf(base) - SEVERITY_ORDER.indexOf(next)) <= 1;
}

export type ReviewResult = {
  findings: ContractFinding[];
  summary: string | null;
  working: WorkingItem[] | null;
  /** Edits the validators refused, so the report can say the model was checked. */
  rejected: string[];
};

export async function reviewFindings(
  url: string,
  pageType: PageTypeResult,
  evaluation: Evaluation,
  findings: ContractFinding[],
): Promise<ReviewResult> {
  const payload = {
    url,
    page_type: pageType.type,
    findings: findings.map((f) => {
      const r = checkOf(f.ruleId);
      const c = criterionOf(f.criterionId);
      return {
        id: f.id,
        criterion: f.criterionId,
        criterion_name: c.name,
        pass_condition: c.passCondition,
        standard: c.standard,
        /** `assisted` criteria are the ones your reading decides. */
        method: c.method,
        measurement: f.ruleId,
        signal: r.signal,
        status: f.status,
        severity_base: r.severityBase,
        severity: f.severity,
        confidence: f.confidence,
        confidence_floor: f.confidenceFloor,
        threshold: r.threshold,
        do_not_fire_when: r.doNotFireWhen,
        instances: f.evidence.length,
        evidence: f.evidence.slice(0, 8).map((e) => ({
          evidence_id: e.evidenceId,
          selector: e.selector,
          observed: e.observed,
          expected: e.expected,
          document_level: e.documentLevel,
          fields: Object.fromEntries(Object.entries(withoutCaptures(e.fields)).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 160) : v])),
        })),
        rationale: f.rationale,
        fix: f.fix,
      };
    }),
    passes: evaluation.passes.map((p) => ({ evidence_id: p.evidence.evidenceId, rule: p.ruleId, note: p.note })),
  };

  const reply = await ask<ReviewReply>(REVIEW_SYSTEM, JSON.stringify(payload, null, 1), REVIEW_SCHEMA, 'medium', 16000);
  return applyReview(reply, evaluation, findings);
}

/**
 * Applies a model reply to the findings, keeping only the edits the contract
 * allows. Pure, so the validation can be tested without calling the model.
 */
export function applyReview(reply: ReviewReply, evaluation: Evaluation, findings: ContractFinding[]): ReviewResult {
  const rejected: string[] = [];
  const byId = new Map(findings.map((f) => [f.id, { ...f }]));

  for (const edit of reply.findings ?? []) {
    const f = byId.get(edit.id);
    if (!f) continue;
    const r = checkOf(f.ruleId);
    const nums = allowed(said(f.evidence), r.whyItMatters, r.fix, r.threshold, f.fix, f.evidence.length);

    if (edit.false_positive && edit.false_positive_reason?.trim()) {
      const why = edit.false_positive_reason.trim();
      const problem = proseProblem(why, nums);
      f.status = 'needs_human_review';
      f.reviewReason = `The review flagged this as a likely false positive${problem ? '.' : `: ${why}`}`;
    }

    const c = Number(edit.confidence);
    if (Number.isFinite(c) && c < f.confidence && c >= 0) {
      f.confidence = Math.round(c * 100) / 100;
      if (f.confidence < f.confidenceFloor && f.status === 'confirmed') {
        f.status = 'needs_human_review';
        const why = edit.confidence_reason?.trim();
        f.reviewReason = `The review lowered confidence to ${f.confidence}, below this rule's floor of ${f.confidenceFloor}${why && !proseProblem(why, nums) ? `: ${why}` : '.'}`;
      }
    } else if (Number.isFinite(c) && c > f.confidence) {
      rejected.push(`${f.id}: confidence may not be raised`);
    }

    if (edit.severity && edit.severity !== f.severity) {
      if (shiftOk(r.severityBase, edit.severity)) {
        const why = edit.severity_reason?.trim();
        f.severityNote = `Moved from ${r.severityBase} to ${edit.severity}${why && !proseProblem(why, nums) ? `: ${why}` : '.'}`;
        f.severity = edit.severity;
      } else {
        rejected.push(`${f.id}: severity may move one step from ${r.severityBase}`);
      }
    }

    const rp = proseProblem(edit.rationale, nums, { rationale: true });
    if (!rp) f.rationale = edit.rationale.trim();
    else if (edit.rationale?.trim() && edit.rationale.trim() !== f.rationale) rejected.push(`${f.id} rationale: ${rp}`);

    const fp = proseProblem(edit.fix, nums) ?? fixProblem(edit.fix, f);
    if (!fp) f.fix = edit.fix.trim();
    else if (edit.fix?.trim() && edit.fix.trim() !== f.fix) rejected.push(`${f.id} fix: ${fp}`);
  }

  /* Merges: same rule only, and only findings that exist. */
  const merged = new Set<string>();
  for (const m of reply.merges ?? []) {
    const group = (m.ids ?? []).map((id) => byId.get(id)).filter((f): f is ContractFinding => !!f && !merged.has(f.id));
    if (group.length < 2) continue;
    if (new Set(group.map((f) => f.ruleId)).size > 1 || new Set(group.map((f) => f.status)).size > 1) {
      rejected.push(`merge ${m.ids.join('+')}: findings from different rules or states`);
      continue;
    }
    const [lead, ...rest] = group;
    for (const other of rest) {
      lead.evidence.push(...other.evidence);
      lead.severity = worse(lead.severity, other.severity);
      lead.confidence = Math.max(lead.confidence, other.confidence);
      merged.add(other.id);
    }
    lead.rootCauseId = `${lead.ruleId}:merged(${group.map((g) => g.rootCauseId.split(':').slice(1).join(':')).join('+')})`;
  }

  const out = findings.map((f) => byId.get(f.id)!).filter((f) => !merged.has(f.id));

  const everything = allowed(out.map((f) => said(f.evidence)), evaluation.passes.map((p) => [p.note, said([p.evidence])]), out.length);
  const summaryProblem = proseProblem(reply.summary, everything, { rationale: true });
  if (summaryProblem && reply.summary?.trim()) rejected.push(`summary: ${summaryProblem}`);

  const passIds = new Map(evaluation.passes.map((p) => [p.evidence.evidenceId, p]));
  const working: WorkingItem[] = [];
  for (const w of reply.what_is_working ?? []) {
    const p = passIds.get(w.evidence_id);
    if (!p) {
      rejected.push(`what_is_working: ${w.evidence_id} is not the evidence of a pass`);
      continue;
    }
    const problem = proseProblem(w.text, allowed(p.note, said([p.evidence])));
    working.push({ ruleId: p.ruleId, evidenceId: p.evidence.evidenceId, text: problem ? p.note : w.text.trim() });
  }

  return {
    findings: out,
    summary: summaryProblem ? null : reply.summary.trim(),
    working: working.length >= 3 ? working : null,
    rejected,
  };
}
