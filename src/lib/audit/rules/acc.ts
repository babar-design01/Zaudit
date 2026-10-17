import type { Measured, KeyStop } from '../browser';
import { contrast, hexToRgb, parseColor, ratio, rgbToHex, suggestColor, type RGB } from '../color';
import { VIEWPORT, type BBox, type Instance, type PageTypeResult, type RuleOutcome } from '../contract';
import { detectLanguage, type DocFacts } from '../document';
import type { AxeNode, AxeRuleResult, Box, ElRef, PageFacts, StyleSnap } from '../probe';

/**
 * How each ACC rule is measured.
 *
 * A rule reads L1 facts and returns one of four outcomes. It fires only on a
 * measured value crossing the catalog's threshold, applies the catalog's
 * `do_not_fire_when` clauses itself, and says `not_evaluated` — with the reason —
 * whenever the measurement it needs did not happen.
 */

export type RuleContext = {
  measured: Measured | null;
  /** Why there is no browser measurement, when there is none. */
  noBrowser: string | null;
  doc: DocFacts | null;
  pageType: PageTypeResult;
};

export type Evaluator = (ctx: RuleContext) => RuleOutcome;

/* ================================================================ helpers */

/** The whole first screen — the box a document-level finding is drawn on. */
export const DOC_BBOX: BBox = [0, 0, VIEWPORT.width, VIEWPORT.height];

/** A box clipped to the first screen, or null when none of it is there. */
export function clip(b: Box | null | undefined): BBox | null {
  if (!b) return null;
  const x = Math.max(0, b.x);
  const y = Math.max(0, b.y);
  const r = Math.min(VIEWPORT.width, b.x + b.w);
  const bottom = Math.min(VIEWPORT.height, b.y + b.h);
  if (r - x <= 0 || bottom - y <= 0) return null;
  return [Math.round(x), Math.round(y), Math.round(r - x), Math.round(bottom - y)];
}

export function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: r - x, h: bottom - y };
}

/** An instance pinned to an element on the first screen. */
export function atElement(
  el: Pick<ElRef, 'selector' | 'box'>,
  observed: string,
  expected: string,
  fields: Instance['evidence']['fields'],
  rest: Omit<Instance, 'evidence'>,
): Instance | null {
  const bbox = clip(el.box);
  if (!bbox) return null;
  return {
    ...rest,
    evidence: { selector: el.selector, bbox, observed, expected, documentLevel: false, fields },
  };
}

/** An instance about the document itself, drawn over the whole first screen. */
export function atDocument(
  selector: string,
  observed: string,
  expected: string,
  fields: Instance['evidence']['fields'],
  rest: Omit<Instance, 'evidence'>,
): Instance {
  return {
    ...rest,
    evidence: { selector, bbox: DOC_BBOX, observed, expected, documentLevel: true, fields },
  };
}

export function docEvidence(selector: string, observed: string, expected: string, fields: Instance['evidence']['fields'] = {}) {
  return { selector, bbox: DOC_BBOX, observed, expected, documentLevel: true, fields };
}

export function elEvidence(el: Pick<ElRef, 'selector' | 'box'>, observed: string, expected: string, fields: Instance['evidence']['fields'] = {}) {
  const bbox = clip(el.box);
  return bbox ? { selector: el.selector, bbox, observed, expected, documentLevel: false, fields } : null;
}

const hexOf = (c: number[]) => rgbToHex([c[0], c[1], c[2]]);
const over = (top: number[], under: number[]): RGB => {
  const a = top[3] ?? 1;
  return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)) as RGB;
};

/** The class-list signature of an element — how instances of one component group together. */
function signature(snippet: string, tag: string): string {
  const cls = snippet.match(/class="([^"]*)"/)?.[1] ?? '';
  return (
    tag +
    '.' +
    cls
      .split(/\s+/)
      .filter((c) => c && !/^(is-|has-|active|hover|focus|selected|current)/.test(c))
      .sort()
      .join('.')
  );
}

function attr(snippet: string, name: string): string | null {
  return snippet.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
}

export type Need<T> = { ok: true; value: T } | { ok: false; outcome: RuleOutcome };

export function facts(ctx: RuleContext, ruleId: string): Need<PageFacts> {
  if (!ctx.measured) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: ctx.noBrowser ?? 'No browser was available to render the page.' } };
  const f = ctx.measured.facts;
  if (!f.ok) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `The page facts could not be read: ${f.error}` } };
  return { ok: true, value: f.value };
}

function axe(ctx: RuleContext, ruleId: string, axeRule: string): Need<AxeRuleResult> {
  if (!ctx.measured) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: ctx.noBrowser ?? 'No browser was available to render the page.' } };
  const a = ctx.measured.axe;
  if (!a.ok) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `axe-core could not run on this page: ${a.error}` } };
  const r = a.value[axeRule];
  if (!r) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `axe-core returned no result for ${axeRule}` } };
  return { ok: true, value: r };
}

function keyboard(ctx: RuleContext, ruleId: string) {
  if (!ctx.measured) return { ok: false as const, outcome: { ruleId, status: 'not_evaluated' as const, reason: ctx.noBrowser ?? 'No browser was available to render the page.' } };
  const k = ctx.measured.keyboard;
  if (!k.ok) return { ok: false as const, outcome: { ruleId, status: 'not_evaluated' as const, reason: `The keyboard walk could not run: ${k.error}` } };
  return { ok: true as const, value: k.value };
}

/** Stops on the first screen, each element once, in the order Tab reached them. */
function firstScreenStops(stops: KeyStop[]): KeyStop[] {
  const seen = new Set<string>();
  return stops.filter((s) => {
    if (s.body || !s.id || !s.box || !s.inView || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/* ============================================================== contrast */

function textContrast(ruleId: 'ACC-001' | 'ACC-002'): Evaluator {
  return (ctx) => {
    const r = axe(ctx, ruleId, 'color-contrast');
    if (!r.ok) return r.outcome;
    const f = facts(ctx, ruleId);
    const palette = f.ok ? f.value.palette : [];
    const large = ruleId === 'ACC-002';
    const target = large ? 3 : 4.5;

    const isLarge = (n: AxeNode) => String(n.data?.expectedContrastRatio ?? '').startsWith('3');
    const nodes = r.value.violations.filter((n) => isLarge(n) === large);
    const unmeasured = r.value.incomplete.filter((n) => isLarge(n) === large && n.inView).length;

    const instances: Instance[] = [];
    for (const n of nodes) {
      if (!n.inView || n.logo || n.ariaHiddenAncestor) continue;
      const fg = parseColor(n.data?.fgColor);
      const bg = parseColor(n.data?.bgColor);
      const observedRatio = Number(n.data?.contrastRatio);
      if (!fg || !bg || !Number.isFinite(observedRatio)) continue;
      const s = suggestColor(fg, bg, target, palette);
      const fontSize = String(n.data?.fontSize ?? '');
      const fontWeight = String(n.data?.fontWeight ?? '');
      const inst = atElement(
        n,
        `${observedRatio}:1 (${rgbToHex(fg)} on ${rgbToHex(bg)})`,
        `>= ${target}:1`,
        {
          observed_ratio: observedRatio,
          foreground_hex: rgbToHex(fg),
          background_hex: rgbToHex(bg),
          font_size: fontSize,
          font_weight: fontWeight,
        },
        {
          confidence: 0.97,
          rootCause: `${rgbToHex(fg)}|${rgbToHex(bg)}`,
          fixVars: {
            foreground_hex: rgbToHex(fg),
            background_hex: rgbToHex(bg),
            suggested_hex: s.hex,
            ...(s.source === 'computed'
              ? { _note: `No colour already used on this page reaches ${target}:1 here, so ${s.hex} is computed from ${rgbToHex(fg)} by lowering its lightness.` }
              : {}),
          },
        },
      );
      if (inst) instances.push(inst);
    }

    const tail = unmeasured
      ? ` ${plural(unmeasured, 'text element')} sit on an image or gradient and could not be measured.`
      : '';
    if (instances.length) {
      return { ruleId, status: 'fail', instances, checked: r.value.passes + nodes.length, note: tail.trim() || undefined };
    }
    const checked = r.value.passes;
    if (!checked && !nodes.length) {
      return { ruleId, status: 'not_applicable', reason: `No ${large ? 'large ' : ''}text was found to measure.${tail}` };
    }
    const rep = f.ok ? f.value.largestText : null;
    return {
      ruleId,
      status: 'pass',
      checked,
      note: `No ${large ? 'large' : 'body'} text on the first screen falls below ${target}:1 — axe-core measured ${plural(checked, 'element')}.${tail}`,
      evidence: rep ? elEvidence(rep, `all measured text >= ${target}:1`, `>= ${target}:1`) : docEvidence('html', `all measured text >= ${target}:1`, `>= ${target}:1`),
    };
  };
}

const ACC_003: Evaluator = (ctx) => {
  const ruleId = 'ACC-003';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const candidates = f.value.controls.filter((c) => c.inView && !c.disabled);
  if (!candidates.length) return { ruleId, status: 'not_applicable', reason: 'No form fields, custom toggles or icon-only buttons on the first screen.' };

  const instances: Instance[] = [];
  let measured = 0;
  for (const c of candidates) {
    if (c.role === 'icon-button') {
      if (!c.innerBg || !c.iconColor) continue;
      measured += 1;
      const icon = over(c.iconColor, c.innerBg);
      const r = ratio(icon, c.innerBg as RGB);
      if (r >= 3) continue;
      const s = suggestColor(icon, c.innerBg as RGB, 3, f.value.palette);
      const inst = atElement(c, `${r}:1 (icon ${rgbToHex(icon)} on ${hexOf(c.innerBg)})`, '>= 3:1', { observed_ratio: r, component_role: 'icon-only button' }, {
        confidence: 0.9,
        rootCause: `icon|${rgbToHex(icon)}|${hexOf(c.innerBg)}`,
        fixVars: { suggested_hex: s.hex },
      });
      if (inst) instances.push(inst);
      continue;
    }
    if (!c.outerBg) continue;
    measured += 1;
    const outer = c.outerBg as RGB;
    // A filled control whose own face stands off the page already has a boundary.
    if (c.innerBg && contrast(c.innerBg as RGB, outer) >= 3) continue;
    const hasBorder = c.borderWidth >= 1 && !['none', 'hidden'].includes(c.borderStyle) && c.borderColor[3] > 0;
    const edge = hasBorder ? over(c.borderColor, outer) : (c.innerBg as RGB | null) ?? outer;
    const r = ratio(edge, outer);
    if (r >= 3) continue;
    const s = suggestColor(edge, outer, 3, f.value.palette);
    const inst = atElement(
      c,
      hasBorder
        ? `${r}:1 (${c.borderWidth}px border ${rgbToHex(edge)} on ${hexOf(outer)})`
        : `${r}:1 (no border; field ${rgbToHex(edge)} on ${hexOf(outer)})`,
      '>= 3:1',
      { observed_ratio: r, component_role: c.role },
      { confidence: 0.9, rootCause: `${c.role}|${rgbToHex(edge)}|${hexOf(outer)}`, fixVars: { suggested_hex: s.hex } },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: measured };
  if (!measured) return { ruleId, status: 'not_evaluated', reason: 'Every control on the first screen sits on an image or gradient, so no boundary ratio could be computed.' };
  const rep = candidates[0];
  return {
    ruleId,
    status: 'pass',
    checked: measured,
    note: `${plural(measured, 'control')} on the first screen ${measured === 1 ? 'has' : 'have'} a visible boundary of at least 3:1.`,
    evidence: elEvidence(rep, 'boundary >= 3:1', '>= 3:1', { component_role: rep.role }),
  };
};

/* ================================================================ labels */

const ACC_004: Evaluator = (ctx) => {
  const ruleId = 'ACC-004';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  // Measured against the catalog's definition, not axe-core's: axe accepts a
  // placeholder as a name, and the catalog says a placeholder is not a label.
  const fields = f.value.fields.filter((x) => !x.honeypot);
  if (!fields.length) return { ruleId, status: 'not_applicable', reason: 'No form fields on the page.' };
  const instances: Instance[] = [];
  for (const x of fields) {
    if (x.labelledBy || !x.inView) continue;
    const inst = atElement(
      x,
      x.placeholder
        ? `placeholder "${x.placeholder}" only — no <label for>, aria-label, aria-labelledby or title`
        : 'no <label for>, aria-label, aria-labelledby or title',
      'a programmatic label',
      { input_type: x.type, placeholder_text: x.placeholder },
      {
        confidence: 0.97,
        rootCause: 'unlabelled-fields',
        // UX-014 describes the same defect when the placeholder is all there is.
        defect: `label:${x.selector}`,
        fixVars: {
          id: x.idAttr ?? (x.nameAttr ? `${x.nameAttr}" (add id="${x.nameAttr}" to the field)` : '{id}'),
          visible_text: x.placeholder || (x.nameAttr ? x.nameAttr.replace(/[-_]/g, ' ') : '{visible_text}'),
        },
      },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: fields.length };
  const rep = fields.find((x) => x.inView) ?? fields[0];
  return {
    ruleId,
    status: 'pass',
    checked: fields.length,
    note: `All ${plural(fields.length, 'form field')} have a programmatic label (${[...new Set(fields.map((x) => x.labelledBy))].join(', ')}).`,
    evidence:
      elEvidence(rep, `labelled by ${rep.labelledBy}`, 'a programmatic label', { input_type: rep.type, placeholder_text: rep.placeholder }) ??
      docEvidence('form', `${fields.length} fields labelled`, 'every field labelled', { input_type: rep.type, placeholder_text: rep.placeholder }),
  };
};

/* ================================================================= focus */

function styleDelta(a: StyleSnap, b: StyleSnap): string[] {
  const out: string[] = [];
  if (a.boxShadow !== b.boxShadow && b.boxShadow !== 'none') out.push('box-shadow');
  if (a.border !== b.border) out.push('border');
  if (a.bg.join() !== b.bg.join()) out.push('background');
  if (a.color.join() !== b.color.join()) out.push('color');
  if (a.textDecoration !== b.textDecoration) out.push('text-decoration');
  if (a.outlineStyle !== b.outlineStyle || a.outlineWidth !== b.outlineWidth) out.push('outline');
  return out;
}

const outlineVisible = (s: StyleSnap) =>
  !['none', 'hidden'].includes(s.outlineStyle) && s.outlineWidth >= 1 && s.outlineColor[3] > 0.1;

function focusColour(f: PageFacts | null, bg: number[] | null): string {
  const base = (bg ?? [255, 255, 255]) as RGB;
  const best = (f?.palette ?? [])
    .map((h) => ({ h, c: hexToRgb(h) }))
    .filter((x): x is { h: string; c: RGB } => !!x.c)
    .map((x) => ({ ...x, r: contrast(x.c, base) }))
    .filter((x) => x.r >= 3)
    .sort((a, b) => b.r - a.r)[0];
  return best?.h ?? (contrast([0, 0, 0], base) >= contrast([255, 255, 255], base) ? '#000000' : '#FFFFFF');
}

const ACC_005: Evaluator = (ctx) => {
  const ruleId = 'ACC-005';
  const k = keyboard(ctx, ruleId);
  if (!k.ok) return k.outcome;
  const f = ctx.measured?.facts.ok ? ctx.measured.facts.value : null;
  const stops = firstScreenStops(k.value.stops).filter((s) => s.focused && s.baseline);
  if (!stops.length) return { ruleId, status: 'not_applicable', reason: 'No keyboard-focusable elements on the first screen.' };

  const instances: Instance[] = [];
  for (const s of stops) {
    const focused = s.focused!;
    if (outlineVisible(focused)) continue;
    const delta = styleDelta(s.baseline!.self, focused);
    const parentDelta = s.parentsFocused
      .map((p, i) => (s.baseline!.parents[i] ? styleDelta(s.baseline!.parents[i], p) : []))
      .flat();

    let hasIndicator: boolean;
    let confidence: number;
    let how: string;
    if (s.pixelChanged != null) {
      // A caret alone is a 1–2px sliver; a real indicator changes more, and wider.
      hasIndicator = s.pixelChanged >= 24 && (s.pixelChangedWidth ?? 0) > 3;
      confidence = 0.95;
      how = `${s.pixelChanged} pixels changed on focus`;
    } else {
      hasIndicator = delta.length > 0 || parentDelta.length > 0;
      confidence = 0.85;
      how = delta.length || parentDelta.length ? `computed style changed: ${[...delta, ...parentDelta].join(', ')}` : 'no computed style change';
    }
    if (hasIndicator) continue;

    const inst = atElement(
      { selector: s.selector!, box: s.box! },
      `no visible change on keyboard focus (${how})`,
      'a visible focus indicator',
      {
        computed_focus_styles: `outline: ${focused.outlineStyle} ${focused.outlineWidth}px; box-shadow: ${focused.boxShadow}; ${delta.length ? 'changed: ' + delta.join(', ') : 'no border, background or shadow change'}`,
      },
      { confidence, rootCause: 'focus-suppressed', fixVars: { focus_color: focusColour(f, s.outerBg) } },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: stops.length };
  const rep = stops[0];
  return {
    ruleId,
    status: 'pass',
    checked: stops.length,
    note: `All ${plural(stops.length, 'focusable element')} reached by Tab on the first screen show a visible change on focus.`,
    evidence: elEvidence({ selector: rep.selector!, box: rep.box! }, 'visible focus change', 'a visible focus indicator'),
  };
};

function shadowColour(shadow: string): number[] | null {
  if (!shadow || shadow === 'none') return null;
  const m = shadow.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i);
  if (!m) return null;
  const c = parseColor(m[0]);
  if (!c) return null;
  const alpha = m[0].match(/rgba\([^)]*,\s*([\d.]+)\s*\)/)?.[1];
  return [...c, alpha ? Number(alpha) : 1];
}

const ACC_006: Evaluator = (ctx) => {
  const ruleId = 'ACC-006';
  const k = keyboard(ctx, ruleId);
  if (!k.ok) return k.outcome;
  const f = ctx.measured?.facts.ok ? ctx.measured.facts.value : null;
  const stops = firstScreenStops(k.value.stops).filter((s) => s.focused && s.baseline);

  const instances: Instance[] = [];
  let rings = 0;
  for (const s of stops) {
    const focused = s.focused!;
    if (!s.elementBg || !s.outerBg) continue;
    const tones: { name: string; c: number[] }[] = [];
    if (focused.outlineStyle === 'auto' && outlineVisible(focused)) {
      // `outline-style: auto` is the browser's own ring. Chromium paints it as two
      // tones — a dark outer ring over a white inner one — so it holds up on any
      // background, whatever single colour the computed style reports.
      tones.push({ name: 'browser ring (outer)', c: focused.outlineColor }, { name: 'browser ring (inner)', c: [255, 255, 255, 1] });
    } else if (outlineVisible(focused)) tones.push({ name: 'outline', c: focused.outlineColor });
    if (focused.boxShadow !== s.baseline!.self.boxShadow) {
      const sc = shadowColour(focused.boxShadow);
      if (sc && sc[3] > 0.1) tones.push({ name: 'box-shadow', c: sc });
    }
    if (!tones.length) continue;
    rings += 1;
    const scored = tones.map((tone) => {
      const onOuter = over(tone.c, s.outerBg!);
      return {
        ...tone,
        hex: rgbToHex(onOuter),
        vsComponent: ratio(onOuter, s.elementBg as RGB),
        vsPage: ratio(onOuter, s.outerBg as RGB),
      };
    });
    // A single ring must reach 3:1 against both surfaces. A double-tone ring
    // exists so that each surface has a tone to contrast with — the dark tone
    // against a light control, the light tone against a dark page — so it passes
    // when each surface has at least one tone that reaches 3:1.
    const passes =
      scored.length > 1
        ? Math.max(...scored.map((t) => t.vsComponent)) >= 3 && Math.max(...scored.map((t) => t.vsPage)) >= 3
        : scored[0].vsComponent >= 3 && scored[0].vsPage >= 3;
    if (passes) continue;
    const worst = scored.sort((a, b) => Math.min(a.vsComponent, a.vsPage) - Math.min(b.vsComponent, b.vsPage))[0];
    const observed = Math.min(worst.vsComponent, worst.vsPage);
    const sug = suggestColor(hexToRgb(worst.hex)!, s.outerBg as RGB, 3, f?.palette ?? []);
    const inst = atElement(
      { selector: s.selector!, box: s.box! },
      `${observed}:1 (${worst.name} ${worst.hex}: ${worst.vsComponent}:1 vs component ${hexOf(s.elementBg)}, ${worst.vsPage}:1 vs page ${hexOf(s.outerBg)})`,
      '>= 3:1 against both',
      { ring_color: worst.hex, observed_ratio: observed },
      { confidence: 0.9, rootCause: worst.hex, fixVars: { suggested_hex: sug.hex } },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: rings };
  if (!rings) return { ruleId, status: 'not_applicable', reason: 'No outline or ring focus indicators on the first screen to measure.' };
  const rep = stops[0];
  return {
    ruleId,
    status: 'pass',
    checked: rings,
    note: `${plural(rings, 'focus ring')} on the first screen reach 3:1 against both the control and the page.`,
    evidence: elEvidence({ selector: rep.selector!, box: rep.box! }, 'ring >= 3:1', '>= 3:1 against both'),
  };
};

/* ------------------------------------------------------ reading order */

type Placed = { i: number; box: Box };

/**
 * Visual reading order by recursive XY-cut: split the stops at the widest band
 * of empty space, top-to-bottom or start-to-end, and recurse. Choosing the
 * widest gap is what lets a set of columns read down each column — as people
 * read a footer — while a single row still reads across.
 */
function readingOrder(items: Placed[], rtl: boolean): Placed[] {
  if (items.length <= 1) return items;
  const cuts = (axis: 'x' | 'y') => {
    const lo = (p: Placed) => (axis === 'y' ? p.box.y : p.box.x);
    const hi = (p: Placed) => (axis === 'y' ? p.box.y + p.box.h : p.box.x + p.box.w);
    const sorted = [...items].sort((a, b) => lo(a) - lo(b));
    const groups: Placed[][] = [[sorted[0]]];
    let reach = hi(sorted[0]);
    let widest = 0;
    for (const p of sorted.slice(1)) {
      if (lo(p) >= reach) {
        widest = Math.max(widest, lo(p) - reach);
        groups.push([p]);
      } else {
        groups[groups.length - 1].push(p);
      }
      reach = Math.max(reach, hi(p));
    }
    return { groups, widest };
  };
  const rows = cuts('y');
  const cols = cuts('x');
  if (rows.groups.length === 1 && cols.groups.length === 1) {
    return [...items].sort((a, b) => a.box.y - b.box.y || (rtl ? b.box.x - a.box.x : a.box.x - b.box.x));
  }
  const useRows = rows.groups.length > 1 && (cols.groups.length === 1 || rows.widest >= cols.widest);
  const groups = useRows ? rows.groups : rtl ? [...cols.groups].reverse() : cols.groups;
  return groups.flatMap((g) => readingOrder(g, rtl));
}

/** Indices (into `seq`) that sit off the longest run already in visual order. */
function outOfSequence(seq: number[]): Set<number> {
  const n = seq.length;
  const len = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (seq[j] < seq[i] && len[j] + 1 > len[i]) {
        len[i] = len[j] + 1;
        prev[i] = j;
      }
    }
  }
  let end = len.indexOf(Math.max(...len));
  const keep = new Set<number>();
  while (end >= 0) {
    keep.add(end);
    end = prev[end];
  }
  return new Set(seq.map((_, i) => i).filter((i) => !keep.has(i)));
}

const ACC_007: Evaluator = (ctx) => {
  const ruleId = 'ACC-007';
  const k = keyboard(ctx, ruleId);
  if (!k.ok) return k.outcome;
  const f = ctx.measured?.facts.ok ? ctx.measured.facts.value : null;
  const stops = firstScreenStops(k.value.stops);
  if (f?.modalOpen || stops.some((s) => s.inModal)) {
    return { ruleId, status: 'not_applicable', reason: 'A modal or drawer was open on load, which reorders focus by design.' };
  }
  if (stops.length < 3) return { ruleId, status: 'not_applicable', reason: 'Fewer than three focusable elements on the first screen.' };

  const visual = readingOrder(stops.map((s, i) => ({ i, box: s.box! })), f?.dir === 'rtl');
  const rank = new Map(visual.map((p, r) => [p.i, r]));
  const seq = stops.map((_, i) => rank.get(i)!);
  const out = outOfSequence(seq);

  const runs: number[][] = [];
  for (let i = 0; i < stops.length; i += 1) {
    if (!out.has(i)) continue;
    if (runs.length && runs[runs.length - 1].at(-1) === i - 1) runs[runs.length - 1].push(i);
    else runs.push([i]);
  }
  const bad = runs.filter((r) => r.length >= 2);
  const label = (s: KeyStop) => (s.name || s.selector || '').slice(0, 40);

  if (!bad.length) {
    const rep = stops[0];
    return {
      ruleId,
      status: 'pass',
      checked: stops.length,
      note: `Tab order through the ${stops.length} focusable elements on the first screen follows their visual order.`,
      evidence: elEvidence({ selector: rep.selector!, box: rep.box! }, 'tab order matches visual order', 'tab order matches visual order'),
    };
  }
  const instances: Instance[] = [];
  for (const run of bad) {
    const box = union(run.map((i) => stops[i].box!));
    const inst = atElement(
      { selector: stops[run[0]].selector!, box: box! },
      `${run.length} consecutive tab stops out of visual order: ${run.map((i) => label(stops[i])).join(' → ')}`,
      'tab order follows top-to-bottom, start-to-end reading order',
      {
        tab_sequence_array: stops.slice(0, 20).map(label),
        visual_sequence_array: visual.slice(0, 20).map((p) => label(stops[p.i])),
      },
      { confidence: 0.82, rootCause: 'reading-order' },
    );
    if (inst) instances.push(inst);
  }
  return { ruleId, status: 'fail', instances, checked: stops.length };
};

/* ================================================================ images */

const FILENAME_ALT =
  /\.(png|jpe?g|gif|svg|webp|avif|bmp)$|^(img|image|photo|picture|pic|dsc|screenshot|untitled|banner|hero)[-_\s]?\d*$|^[a-z0-9]+([-_][a-z0-9]+){2,}$/i;
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const ACC_008: Evaluator = (ctx) => {
  const ruleId = 'ACC-008';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const missing = axe(ctx, ruleId, 'image-alt');
  if (!missing.ok) return missing.outcome;
  const roleImg = axe(ctx, ruleId, 'role-img-alt');
  const inputImg = axe(ctx, ruleId, 'input-image-alt');

  const instances: Instance[] = [];
  const flagged = new Set<string>();
  const imageBy = new Map(f.value.images.map((i) => [i.selector, i]));

  for (const n of [...missing.value.violations, ...(roleImg.ok ? roleImg.value.violations : []), ...(inputImg.ok ? inputImg.value.violations : [])]) {
    if (!n.inView || n.ariaHiddenAncestor) continue;
    const img = imageBy.get(n.selector);
    if (img?.presentational) continue;
    const src = img?.src ?? attr(n.snippet, 'src') ?? '';
    const inst = atElement(n, 'no alt attribute', 'alt text describing the image’s purpose', {
      image_src: src,
      surrounding_text: img?.surrounding ?? '',
    }, { confidence: 0.95, rootCause: 'missing-alt' });
    if (inst) {
      instances.push(inst);
      flagged.add(n.selector);
    }
  }

  /* Empty alt is correct for decoration. It is only a fault when the image is
     carrying something — and that takes two independent signals to say. */
  for (const img of f.value.images) {
    if (!img.inView || img.alt !== '' || img.ariaHidden || img.presentational || flagged.has(img.selector)) continue;
    if (img.figcaption) continue; // the caption already says it
    const signals: string[] = [];
    if (img.inControl && !img.controlHasOtherText) signals.push('the image is the only content of its link or button');
    if (img.inFigure) signals.push('the image is a <figure> without a caption');
    if (img.box.w >= 150 && img.box.h >= 100) signals.push(`rendered at ${img.box.w}×${img.box.h}px`);
    if (/(product|chart|graph|diagram|screenshot|infographic|map|team|portrait)/i.test(img.src)) signals.push('file name names content');
    if (signals.length < 2) continue;
    const inst = atElement(img, 'alt="" on an image carrying information', 'alt text describing the image’s purpose', {
      image_src: img.src,
      surrounding_text: img.surrounding,
    }, { confidence: 0.8, rootCause: 'empty-alt', signals });
    if (inst) instances.push(inst);
  }

  const inView = f.value.images.filter((i) => i.inView && !i.ariaHidden);
  if (instances.length) return { ruleId, status: 'fail', instances, checked: inView.length };
  if (!inView.length) return { ruleId, status: 'not_applicable', reason: 'No images on the first screen.' };
  const rep = inView[0];
  return {
    ruleId,
    status: 'pass',
    checked: inView.length,
    note: `All ${plural(inView.length, 'image')} on the first screen either carry alt text or are marked decorative without depending on it.`,
    evidence: elEvidence(rep, `alt="${(rep.alt ?? '').slice(0, 60)}"`, 'alt present or deliberately empty', { image_src: rep.src }),
  };
};

const ACC_009: Evaluator = (ctx) => {
  const ruleId = 'ACC-009';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const withAlt = f.value.images.filter((i) => i.inView && i.alt && !i.ariaHidden && !i.presentational);
  if (!withAlt.length) return { ruleId, status: 'not_applicable', reason: 'No images with alt text on the first screen.' };

  const instances: Instance[] = [];
  for (const img of withAlt) {
    const alt = img.alt!.trim();
    const base = (img.src.split(/[?#]/)[0].split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '');
    const isFilename = FILENAME_ALT.test(alt) || (!!base && norm(alt) === norm(base));
    const dup = !!img.adjacentText && norm(alt) === norm(img.adjacentText);
    if (!isFilename && !dup) continue;
    const inst = atElement(
      img,
      isFilename ? `alt="${alt}" reads as a file name` : `alt="${alt}" repeats the adjacent text`,
      'alt="" for decoration, or alt that adds information',
      { alt_value: alt, adjacent_text: img.adjacentText },
      { confidence: isFilename ? 0.9 : 0.8, rootCause: isFilename ? 'filename-alt' : 'duplicate-alt' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: withAlt.length };
  const rep = withAlt[0];
  return {
    ruleId,
    status: 'pass',
    checked: withAlt.length,
    note: `None of the ${plural(withAlt.length, 'image')} with alt text on the first screen use a file name or repeat the text beside them.`,
    evidence: elEvidence(rep, `alt="${rep.alt!.slice(0, 60)}"`, 'meaningful alt', { alt_value: rep.alt, adjacent_text: rep.adjacentText }),
  };
};

/* ============================================================== headings */

const ACC_010: Evaluator = (ctx) => {
  const ruleId = 'ACC-010';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const hs = f.value.headings;
  if (hs.length < 2) return { ruleId, status: 'not_applicable', reason: 'Fewer than two headings on the page.' };
  const map = hs.slice(0, 24).map((h) => `h${h.level} ${h.text.slice(0, 40)}`);

  const instances: Instance[] = [];
  let skips = 0;
  for (let i = 1; i < hs.length; i += 1) {
    const prev = hs[i - 1];
    const cur = hs[i];
    if (cur.level - prev.level <= 1) continue;
    // An aside or footer that opens its own outline is allowed its own root.
    if (cur.landmark && cur.landmark !== 'nav' && cur.firstInLandmark) continue;
    skips += 1;
    const inst = atElement(cur, `h${prev.level} → h${cur.level} ("${cur.text.slice(0, 50)}")`, `h${prev.level + 1} or shallower`, {
      heading_map: map,
    }, {
      confidence: 0.97,
      rootCause: 'heading-levels',
      fixVars: { selector: cur.selector, observed: String(cur.level), expected: String(prev.level + 1) },
    });
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: hs.length };
  const rep = hs.find((h) => h.inView) ?? hs[0];
  return {
    ruleId,
    status: 'pass',
    checked: hs.length,
    note: skips
      ? `The heading outline skips a level ${plural(skips, 'time')}, but only below the first screen, which this audit does not flag.`
      : `The ${hs.length} headings descend one level at a time.`,
    evidence: elEvidence(rep, map.slice(0, 4).join(' › '), 'no skipped levels', { heading_map: map }) ?? docEvidence('h1, h2, h3, h4, h5, h6', map.slice(0, 4).join(' › '), 'no skipped levels', { heading_map: map }),
  };
};

const ACC_011: Evaluator = (ctx) => {
  const ruleId = 'ACC-011';
  const f = ctx.measured?.facts.ok ? ctx.measured.facts.value : null;
  if (!f && !ctx.doc) return { ruleId, status: 'not_evaluated', reason: ctx.noBrowser ?? 'The page could not be read.' };

  const scope = f ? f.h1.scope : 'document';
  const items = f ? f.h1.items : [];
  const count = f ? items.length : ctx.doc!.h1Count;
  const values = f ? items.map((h) => h.text) : ctx.doc!.h1Values;
  const where = scope === 'main' ? 'in <main>' : 'on the page';

  if (count === 1) {
    const h = items[0];
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The page has exactly one h1: "${values[0]?.slice(0, 60)}".`,
      evidence: (h && elEvidence(h, '1 h1', 'exactly 1 h1', { h1_count: 1, h1_values: values })) || docEvidence('h1', '1 h1', 'exactly 1 h1', { h1_count: 1, h1_values: values }),
    };
  }

  const fields = { h1_count: count, h1_values: values };
  if (count === 0) {
    const promote = f?.largestText?.selector ?? 'the page’s main heading';
    return {
      ruleId,
      status: 'fail',
      checked: 1,
      instances: [
        atDocument(scope === 'main' ? 'main' : 'body', `0 h1 ${where}`, 'exactly 1 h1', fields, {
          confidence: f ? 0.95 : 0.9,
          rootCause: 'h1-count',
          fixVars: { selector: promote },
        }),
      ],
    };
  }

  // More than one. Separate sectioning roots soften it to a warning.
  const sectioned = items.length > 0 && items.every((h) => h.sectionRoot);
  const severity = sectioned ? ('low' as const) : ('medium' as const);
  const visible = items.map((h) => atElement(h, `${count} h1 elements ${where}`, 'exactly 1 h1', fields, {
    confidence: 0.92,
    rootCause: 'h1-count',
    severity,
    fixVars: { selector: h.selector },
  })).filter((x): x is Instance => !!x);
  return {
    ruleId,
    status: 'fail',
    checked: count,
    instances: visible.length
      ? visible
      : [atDocument('h1', `${count} h1 elements ${where}`, 'exactly 1 h1', fields, { confidence: 0.9, rootCause: 'h1-count', severity, fixVars: { selector: 'the h1 that names the page' } })],
  };
};

/* =========================================================== target size */

const ACC_012: Evaluator = (ctx) => {
  const ruleId = 'ACC-012';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const a = axe(ctx, ruleId, 'target-size');
  if (!a.ok) return a.outcome;

  const instances: Instance[] = [];
  const failed = new Set<string>();
  // FAIL: under 24×24 without the spacing exemption — axe-core measures both.
  for (const n of a.value.violations) {
    if (!n.inView) continue;
    const inst = atElement(n, `${n.box.w}×${n.box.h}px with less than 24px of clear spacing`, '>= 24×24px (WCAG 2.2 minimum)', {
      computed_w: n.box.w,
      computed_h: n.box.h,
    }, { confidence: 0.95, rootCause: signature(n.snippet, n.tag), severity: 'high', defect: `target:${n.selector}` });
    if (inst) {
      instances.push(inst);
      failed.add(n.selector);
    }
  }

  // WARN: under 44×44. Downgraded to low, per the catalog.
  const big = f.value.interactive.filter((x) => x.box.w >= 44 && x.box.h >= 44);
  let warned = 0;
  for (const el of f.value.interactive) {
    if (failed.has(el.selector) || el.inline) continue;
    if (el.box.w >= 44 && el.box.h >= 44) continue;
    const equivalent = big.some(
      (b) => b.selector !== el.selector && ((el.href && el.href !== '#' && b.href === el.href) || (el.name && b.name === el.name)),
    );
    if (equivalent) continue;
    const inst = atElement(el, `${el.box.w}×${el.box.h}px`, '>= 44×44px (recommended)', {
      computed_w: el.box.w,
      computed_h: el.box.h,
    }, { confidence: 0.92, rootCause: signature(el.snippet, el.tag), severity: 'low', defect: `target:${el.selector}` });
    if (inst) {
      instances.push(inst);
      warned += 1;
    }
  }
  const checked = f.value.interactive.length;
  if (instances.length) return { ruleId, status: 'fail', instances, checked };
  if (!checked) return { ruleId, status: 'not_applicable', reason: 'No interactive targets on the first screen.' };
  const rep = f.value.interactive[0];
  return {
    ruleId,
    status: 'pass',
    checked,
    note: `All ${plural(checked, 'interactive target')} on the first screen are at least 44×44px or exempt as inline links.`,
    evidence: elEvidence(rep, `${rep.box.w}×${rep.box.h}px`, '>= 44×44px', { computed_w: rep.box.w, computed_h: rep.box.h }),
  };
};

/* ========================================================= colour alone */

const ACC_013: Evaluator = (ctx) => {
  const ruleId = 'ACC-013';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const instances: Instance[] = [];
  for (const g of f.value.colorGroups) {
    const labels = g.items.map((i) => norm(i.label));
    const noTextDelta = new Set(labels).size === 1;
    const noIcon = !g.items.some((i) => i.hasIcon);
    const signals: string[] = [];
    if (noTextDelta && noIcon) signals.push('items differ in colour but not in text, label or icon');
    if (g.keywords) signals.push('the items are named as status, legend or indicator');
    // The contract asks two independent signals of a subjective rule before it fires.
    if (signals.length < 2) continue;
    const inst = atElement(
      g.container,
      `${g.items.length} items distinguished only by colour (${[...new Set(g.items.map((i) => i.color))].join(', ')})`,
      'colour plus a text label, icon or pattern',
      {
        selector_group: g.items.map((i) => i.selector).slice(0, 12),
        color_values: g.items.map((i) => i.color),
        text_content: g.items.map((i) => i.label.slice(0, 40)),
      },
      { confidence: 0.78, rootCause: g.container.selector, signals },
    );
    if (inst) instances.push(inst);
  }
  const note = 'Form error states only appear after input and were not exercised in this audit.';
  if (instances.length) return { ruleId, status: 'fail', instances, checked: f.value.colorGroups.length, note };
  return {
    ruleId,
    status: 'pass',
    checked: f.value.colorGroups.length,
    note: `No group of elements on the first screen is told apart by colour alone. ${note}`,
    evidence: null,
  };
};

/* ============================================================== document */

function docFrom(ctx: RuleContext) {
  const f = ctx.measured?.facts.ok ? ctx.measured.facts.value : null;
  if (f) {
    return { lang: f.lang, htmlAttributes: f.htmlAttributes, title: f.title, viewportMeta: f.viewportMeta, landmarks: f.landmarks, navLinkMax: f.navLinkMax, bodyText: f.bodyText };
  }
  const d = ctx.doc;
  if (!d) return null;
  return { lang: d.lang, htmlAttributes: d.htmlAttributes, title: d.title, viewportMeta: d.viewportMeta, landmarks: d.landmarks, navLinkMax: d.navLinkMax, bodyText: d.bodyText };
}

const ACC_014: Evaluator = (ctx) => {
  const ruleId = 'ACC-014';
  const d = docFrom(ctx);
  if (!d) return { ruleId, status: 'not_evaluated', reason: 'The page could not be read.' };
  const attrs = Object.entries(d.htmlAttributes).map(([k, v]) => `${k}="${v}"`).join(' ') || '(none)';
  const lang = (d.lang ?? '').trim();
  let problem: string | null = null;
  if (d.lang == null) problem = 'no lang attribute';
  else if (!lang) problem = 'lang=""';
  else {
    try {
      Intl.getCanonicalLocales(lang);
    } catch {
      problem = `lang="${lang}" is not a valid BCP-47 tag`;
    }
  }
  if (!problem) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The document declares its language: lang="${lang}".`,
      evidence: docEvidence('html', `lang="${lang}"`, 'a valid BCP-47 lang', { html_attributes: attrs }),
    };
  }
  const detected = detectLanguage(d.bodyText);
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument('html', problem, 'a valid BCP-47 lang, e.g. lang="en"', { html_attributes: attrs }, {
        confidence: 0.99,
        rootCause: 'lang',
        fixVars: detected
          ? { detected_language: detected.code }
          : { detected_language: 'xx', _note: 'The page’s language could not be read confidently from its text; replace "xx" with its BCP-47 code (for example "en").' },
      }),
    ],
  };
};

const GENERIC_TITLE = /^(home|homepage|untitled|untitled document|react app|vite app|vite \+ react|document|index|welcome|new page|page|create next app|next\.js app|my app|app)$/i;

const ACC_015: Evaluator = (ctx) => {
  const ruleId = 'ACC-015';
  const d = docFrom(ctx);
  if (!d) return { ruleId, status: 'not_evaluated', reason: 'The page could not be read.' };
  const title = (d.title ?? '').trim();
  const fields = { title_value: title, duplicate_urls: [] as string[] };
  let problem: string | null = null;
  let confidence = 0.95;
  if (d.title == null) problem = 'no <title> element';
  else if (!title) problem = 'empty <title>';
  else if (GENERIC_TITLE.test(title)) problem = `generic title "${title}"`;
  else if (title.length > 60) {
    problem = `${title.length} characters: "${title.slice(0, 70)}…"`;
    confidence = 0.9;
  }
  const scope = 'Duplication across pages is not measured: this audit reads one page.';
  if (!problem) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The title "${title}" is specific and ${title.length} characters long. ${scope}`,
      evidence: docEvidence('head > title', `"${title}" (${title.length} chars)`, 'specific, <= 60 chars', fields),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    note: scope,
    instances: [atDocument('head > title', problem, 'a specific title under 60 characters', fields, { confidence, rootCause: 'title' })],
  };
};

const ACC_023: Evaluator = (ctx) => {
  const ruleId = 'ACC-023';
  const d = docFrom(ctx);
  if (!d) return { ruleId, status: 'not_evaluated', reason: 'The page could not be read.' };
  const l = d.landmarks;
  const map = `main: ${l.main}, nav: ${l.nav}, header: ${l.header}, footer: ${l.footer}, aside: ${l.aside}`;
  if (l.main > 0) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The page marks its regions with landmarks (${map}).`,
      evidence: docEvidence('main, [role="main"]', map, '<main> present', { landmark_map: map }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [atDocument('body', 'no <main> or role="main"', 'one <main> landmark', { landmark_map: map }, { confidence: 0.97, rootCause: 'landmarks' })],
  };
};

const ACC_024: Evaluator = (ctx) => {
  const ruleId = 'ACC-024';
  const d = docFrom(ctx);
  if (!d) return { ruleId, status: 'not_evaluated', reason: 'The page could not be read.' };
  if (d.viewportMeta == null) {
    return { ruleId, status: 'not_applicable', reason: 'There is no viewport meta tag, so nothing on the page restricts zoom through one.' };
  }
  const content = d.viewportMeta;
  const pairs = Object.fromEntries(
    content.split(/[,;]/).map((p) => p.split('=').map((s) => s.trim().toLowerCase())).filter((p) => p.length === 2),
  );
  const noScale = ['no', '0'].includes(pairs['user-scalable'] ?? '');
  const max = pairs['maximum-scale'] != null ? Number(pairs['maximum-scale']) : null;
  const lowMax = max != null && Number.isFinite(max) && max < 2;
  if (!noScale && !lowMax) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The viewport tag leaves zoom available: "${content}".`,
      evidence: docEvidence('meta[name="viewport"]', content, 'no user-scalable=no, maximum-scale >= 2', { viewport_meta_content: content }),
    };
  }
  return {
    ruleId,
    status: 'fail',
    checked: 1,
    instances: [
      atDocument('meta[name="viewport"]', noScale ? `user-scalable=${pairs['user-scalable']}` : `maximum-scale=${max}`, 'zoom allowed (no user-scalable=no; maximum-scale >= 2)', { viewport_meta_content: content }, { confidence: 0.99, rootCause: 'zoom' }),
    ],
  };
};

/* ================================================================= links */

const GENERIC_LINK = new Set(['click here', 'read more', 'learn more', 'here', 'this', 'more', 'link', '>>']);

const ACC_016: Evaluator = (ctx) => {
  const ruleId = 'ACC-016';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const links = f.value.links;
  if (!links.length) return { ruleId, status: 'not_applicable', reason: 'No links on the first screen.' };
  const generic = links.filter((l) => {
    const raw = l.name.trim();
    if (raw === '>>' || raw === '»') return true;
    const n = raw.toLowerCase().replace(/[\s→›»>.…!:]+$/u, '').trim();
    if (GENERIC_LINK.has(n)) return true;
    return /^(https?:\/\/|www\.)\S+$/i.test(raw) || (!!l.href && raw === l.href);
  });
  if (generic.length < 2) {
    return {
      ruleId,
      status: 'pass',
      checked: links.length,
      note: generic.length
        ? `1 of ${links.length} links on the first screen uses generic text, below the threshold of 2.`
        : `All ${links.length} links on the first screen name their destination.`,
      evidence: elEvidence(links[0], `"${links[0].name.slice(0, 50)}"`, 'descriptive link text', { link_text: links[0].name.slice(0, 80), href: links[0].href }),
    };
  }
  const instances = generic
    .map((l) => atElement(l, `link text "${l.name}"`, 'text naming the destination', { link_text: l.name, href: l.href }, { confidence: 0.9, rootCause: 'generic-links' }))
    .filter((x): x is Instance => !!x);
  return { ruleId, status: 'fail', instances, checked: links.length };
};

/* ================================================================ motion */

const ACC_017: Evaluator = (ctx) => {
  const ruleId = 'ACC-017';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const motion = f.value.motion.filter((m) => m.inView && (m.durationMs > 300 || m.transformBased));
  if (!motion.length) {
    return {
      ruleId,
      status: 'not_applicable',
      reason: 'Nothing on the first screen animates for more than 300ms or moves by transform.',
    };
  }
  const reduce = ctx.measured!.reduce;
  if (!reduce.ok) return { ruleId, status: 'not_evaluated', reason: `Reduced motion could not be emulated: ${reduce.error}` };

  const instances: Instance[] = [];
  const seen = new Set<string>();
  for (const m of motion) {
    const after = reduce.value[m.id];
    if (!after?.moving || seen.has(m.id)) continue;
    seen.add(m.id);
    const inst = atElement(m, `with reduced motion requested: ${after.detail}`, 'motion stops or drops under 300ms when prefers-reduced-motion: reduce', {
      animation_properties: `${m.kind} ${m.name} ${m.durationMs}ms (${m.props.join(', ')})`,
      stylesheet_ref: m.sheet,
    }, { confidence: 0.92, rootCause: 'reduced-motion' });
    if (inst) instances.push(inst);
  }
  if (instances.length) {
    return {
      ruleId,
      status: 'fail',
      instances,
      checked: motion.length,
      note: f.value.reducedMotionRule ? 'A prefers-reduced-motion block exists, but it does not cover these elements.' : 'No prefers-reduced-motion block was found in the readable stylesheets.',
    };
  }
  const rep = motion[0];
  return {
    ruleId,
    status: 'pass',
    checked: motion.length,
    note: `All ${plural(motion.length, 'moving element')} on the first screen stop when reduced motion is requested.`,
    evidence: elEvidence(rep, 'stops under reduced motion', 'motion honours prefers-reduced-motion', { animation_properties: `${rep.kind} ${rep.name}`, stylesheet_ref: rep.sheet }),
  };
};

const ACC_018: Evaluator = (ctx) => {
  const ruleId = 'ACC-018';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const auto = f.value.media.filter((m) => m.autoplay || m.playing);
  if (!auto.length) return { ruleId, status: 'not_applicable', reason: 'No media plays on its own.' };

  const instances: Instance[] = [];
  let unknown = 0;
  for (const m of auto) {
    if (m.duration == null) {
      unknown += 1;
      continue;
    }
    if (m.duration <= 5) continue;
    if (m.muted && m.loop && m.duration < 5 && m.decorative) continue;
    const hasControls = m.controls || m.nearbyControl;
    if (hasControls) continue;
    const fields = { media_src: m.src, duration: Number.isFinite(m.duration) ? m.duration : 'live stream', has_controls: false };
    const observed = `${m.kind} autoplays for ${Number.isFinite(m.duration) ? m.duration + 's' : 'an unbounded stream'}${m.muted ? ' (muted)' : ' with sound'}, no pause control`;
    const inst =
      m.kind === 'audio' || !m.inView
        ? m.kind === 'audio'
          ? atDocument(m.selector, observed, 'a visible pause/stop control', fields, { confidence: 0.92, rootCause: m.selector })
          : null
        : atElement(m, observed, 'a visible pause/stop control', fields, { confidence: 0.92, rootCause: m.selector });
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: auto.length };
  if (unknown === auto.length) {
    return { ruleId, status: 'not_evaluated', reason: 'Autoplaying media was found, but its duration had not loaded when the page was measured.' };
  }
  const rep = auto[0];
  return {
    ruleId,
    status: 'pass',
    checked: auto.length,
    note: `Autoplaying media on the page is under 5 seconds or has a pause control.`,
    evidence: elEvidence(rep, rep.controls || rep.nearbyControl ? 'pause control present' : `${rep.duration}s`, 'pause control, or under 5s', { media_src: rep.src, duration: rep.duration ?? 'unknown', has_controls: rep.controls || rep.nearbyControl }),
  };
};

const ACC_019: Evaluator = (ctx) => {
  const ruleId = 'ACC-019';
  const f = facts(ctx, ruleId);
  if (!f.ok) return f.outcome;
  const flash = ctx.measured!.flash;
  if (!flash) {
    return { ruleId, status: 'not_applicable', reason: 'Nothing on the first screen animates, plays or draws to a canvas, so nothing can flash.' };
  }
  if (!flash.ok) return { ruleId, status: 'not_evaluated', reason: `Flashing could not be measured: ${flash.error}` };
  const r = flash.value;
  const seq = `${r.frames} frames at ${r.fps} fps over ${r.durationMs}ms`;
  const fires = r.maxRate > 3 && r.areaPct > 25 && !!r.bbox && r.bbox.w >= 341 && r.bbox.h >= 256;
  if (!fires) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The first screen was recorded (${seq}); the fastest flash measured was ${r.maxRate} per second over ${r.areaPct}% of the screen.`,
      evidence: docEvidence('html', `${r.maxRate} flashes/s over ${r.areaPct}%`, '<= 3 flashes/s, or <= 25% of the screen', { screenshot_sequence: seq, flash_rate: r.maxRate, affected_area_pct: r.areaPct }),
    };
  }
  const inst = atElement({ selector: 'html', box: r.bbox! }, `${r.maxRate} flashes per second over ${r.areaPct}% of the screen`, '<= 3 flashes per second', {
    screenshot_sequence: seq,
    flash_rate: r.maxRate,
    affected_area_pct: r.areaPct,
  }, { confidence: 0.8, rootCause: 'flash' });
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: 1 } : { ruleId, status: 'not_evaluated', reason: 'The flashing region could not be placed on the first screen.' };
};

/* ============================================================== keyboard */

const ACC_020: Evaluator = (ctx) => {
  const ruleId = 'ACC-020';
  const k = keyboard(ctx, ruleId);
  if (!k.ok) return k.outcome;
  const { trap, completed, stops, limit, stuckInFrame, opaquePresses } = k.value;
  const opaque = opaquePresses
    ? ` A further ${opaquePresses} presses moved through an embedded frame or closed widget whose controls could not be inspected.`
    : '';
  if (stuckInFrame) {
    return {
      ruleId,
      status: 'not_evaluated',
      reason: `Focus stayed on ${stuckInFrame} for 40 Tab presses. Its contents are an embedded frame or a closed widget that cannot be inspected, so whether it traps focus is unknown.`,
    };
  }
  const real = stops.filter((s) => !s.body).length;
  if (!trap) {
    const rep = firstScreenStops(stops)[0];
    return {
      ruleId,
      status: 'pass',
      checked: real,
      note: completed
        ? `Tab moved through ${plural(real, 'inspectable element')} and back out to the document without getting stuck.${opaque}`
        : `No focus loop in the first ${limit} tab stops; the page has more than that and the rest were not walked.`,
      evidence: rep ? elEvidence({ selector: rep.selector!, box: rep.box! }, 'focus moves on', 'Tab can leave every element') : docEvidence('body', 'focus moves on', 'Tab can leave every element'),
    };
  }
  if (trap.releasesOnEscape && trap.closeControlInLoop) {
    return {
      ruleId,
      status: 'pass',
      checked: real,
      note: `Focus loops inside a ${trap.selectors.length}-element overlay, which releases on Escape and contains a close control — an intentional modal trap.`,
      evidence: null,
    };
  }
  const box = union(trap.boxes);
  const inst = atElement(
    { selector: trap.selectors[0], box: box! },
    `Tab cycles through ${trap.selectors.length} elements and cannot leave them; ${trap.releasesOnEscape ? 'Escape releases focus, but there is no close control in the loop' : 'Escape does not release focus'}`,
    'Tab, Shift+Tab or Escape leaves the region',
    {
      tab_sequence_array: trap.names.map((n, i) => n || trap.selectors[i]).slice(0, 12),
      escape_behavior: trap.releasesOnEscape ? 'releases focus' : 'focus stays in the loop',
    },
    { confidence: 0.93, rootCause: 'keyboard-trap' },
  );
  if (!inst) {
    return { ruleId, status: 'not_applicable', reason: 'A focus loop exists, but outside the first screen, which this audit does not flag.' };
  }
  return { ruleId, status: 'fail', instances: [inst], checked: real };
};

const ACC_021: Evaluator = (ctx) => {
  const ruleId = 'ACC-021';
  const d = docFrom(ctx);
  if (!d) return { ruleId, status: 'not_evaluated', reason: 'The page could not be read.' };
  if (d.navLinkMax < 5) return { ruleId, status: 'not_applicable', reason: `The navigation has ${d.navLinkMax} links, below the 5 that make a skip link necessary.` };
  if (d.landmarks.main > 0) {
    return { ruleId, status: 'not_applicable', reason: 'A <main> landmark lets screen-reader users jump straight to the content.' };
  }
  const k = keyboard(ctx, ruleId);
  if (!k.ok) return k.outcome;
  const first = k.value.stops.find((s) => !s.body);
  if (!first) return { ruleId, status: 'not_evaluated', reason: 'Tab reached no element, so the first focusable element is unknown.' };
  const isSkip = !!first.href?.startsWith('#') && /skip|jump to|main content|to content/i.test(first.name);
  const fields = { first_focusable_element: `${first.tag} "${first.name}"`, nav_link_count: d.navLinkMax };
  if (isSkip) {
    return {
      ruleId,
      status: 'pass',
      checked: 1,
      note: `The first Tab stop is a skip link: "${first.name}".`,
      evidence: (first.box && elEvidence({ selector: first.selector!, box: first.box }, `"${first.name}"`, 'skip link first', fields)) || docEvidence(first.selector!, `"${first.name}"`, 'skip link first', fields),
    };
  }
  const observed = `first Tab stop is ${first.tag} "${first.name.slice(0, 40)}"; navigation has ${d.navLinkMax} links`;
  const inst =
    (first.box && first.inView && atElement({ selector: first.selector!, box: first.box }, observed, 'a skip-to-content link as the first Tab stop', fields, { confidence: 0.9, rootCause: 'skip-link' })) ||
    atDocument('body', observed, 'a skip-to-content link as the first Tab stop', fields, { confidence: 0.9, rootCause: 'skip-link' });
  return { ruleId, status: 'fail', instances: [inst], checked: 1 };
};

/* ============================================================ icon names */

const ACTIONS: [RegExp, string][] = [
  [/close|dismiss|x-mark|xmark/i, 'Close'],
  [/menu|hamburger|burger|nav-toggle/i, 'Open menu'],
  [/search|magnif/i, 'Search'],
  [/cart|basket|bag/i, 'Open cart'],
  [/user|account|profile|avatar/i, 'Account'],
  [/prev|left|back/i, 'Previous'],
  [/next|right|forward/i, 'Next'],
  [/play/i, 'Play'],
  [/pause/i, 'Pause'],
  [/share/i, 'Share'],
  [/(^|[-_ ])(heart|like|fav)/i, 'Add to favourites'],
];

const ACC_022: Evaluator = (ctx) => {
  const ruleId = 'ACC-022';
  const b = axe(ctx, ruleId, 'button-name');
  if (!b.ok) return b.outcome;
  const l = axe(ctx, ruleId, 'link-name');
  const nodes = [...b.value.violations, ...(l.ok ? l.value.violations : [])];
  const instances: Instance[] = [];
  for (const n of nodes) {
    if (!n.inView || !n.hasSvgOrIcon || n.hasImg) continue;
    const action = ACTIONS.find(([re]) => re.test(n.snippet))?.[1];
    const icon = n.snippet.match(/<(svg|i|span)[^>]*>/i)?.[0] ?? '';
    const inst = atElement(n, `${n.tag} with only an icon and no accessible name`, 'aria-label naming the action', { icon_ref: icon.slice(0, 120) }, {
      confidence: 0.95,
      rootCause: signature(n.snippet, n.tag),
      fixVars: action ? { action } : {},
    });
    if (inst) instances.push(inst);
  }
  const checked = b.value.passes + (l.ok ? l.value.passes : 0) + nodes.length;
  if (instances.length) return { ruleId, status: 'fail', instances, checked };
  if (!checked) return { ruleId, status: 'not_applicable', reason: 'No buttons or links on the page.' };
  return {
    ruleId,
    status: 'pass',
    checked,
    note: `Every button and link axe-core checked (${checked}) has an accessible name.`,
    evidence: docEvidence('a, button', `${checked} named controls`, 'every control named'),
  };
};

/* ================================================================ export */

export const ACC_EVALUATORS: Record<string, Evaluator> = {
  'ACC-001': textContrast('ACC-001'),
  'ACC-002': textContrast('ACC-002'),
  'ACC-003': ACC_003,
  'ACC-004': ACC_004,
  'ACC-005': ACC_005,
  'ACC-006': ACC_006,
  'ACC-007': ACC_007,
  'ACC-008': ACC_008,
  'ACC-009': ACC_009,
  'ACC-010': ACC_010,
  'ACC-011': ACC_011,
  'ACC-012': ACC_012,
  'ACC-013': ACC_013,
  'ACC-014': ACC_014,
  'ACC-015': ACC_015,
  'ACC-016': ACC_016,
  'ACC-017': ACC_017,
  'ACC-018': ACC_018,
  'ACC-019': ACC_019,
  'ACC-020': ACC_020,
  'ACC-021': ACC_021,
  'ACC-022': ACC_022,
  'ACC-023': ACC_023,
  'ACC-024': ACC_024,
};
