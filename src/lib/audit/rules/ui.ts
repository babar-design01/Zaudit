import type { Measured } from '../browser';
import { deltaE, hexToRgb, oklch } from '../color';
import type { Instance, RuleOutcome, SeverityLevel } from '../contract';
import type { Inventory, Tally, UiFacts } from '../probe-ui';
import { atElement, docEvidence, elEvidence, plural, union, type Evaluator, type Need, type RuleContext } from './acc';

/**
 * How each UI rule is measured. This family judges discipline, not taste: a
 * page is held to its own scales wherever it has them.
 *
 * Everything is read from the first 1440×900 screen, and "across pages" rules
 * compare within that screen, since one page is read — each says so in its
 * note.
 */

/* ============================================================== helpers */

function ui(ctx: RuleContext, ruleId: string): Need<UiFacts> {
  if (!ctx.measured) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: ctx.noBrowser ?? 'No browser was available to render the page.' } };
  const u = ctx.measured.ui;
  if (!u.ok) return { ok: false, outcome: { ruleId, status: 'not_evaluated', reason: `The UI facts could not be read: ${u.error}` } };
  return { ok: true, value: u.value };
}

const notEvaluated = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_evaluated', reason });
const notApplicable = (ruleId: string, reason: string): RuleOutcome => ({ ruleId, status: 'not_applicable', reason });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const counts = (t: Tally[]) => t.map((x) => `${x.value} ×${x.count}`);
const first = (t: Tally[]) => t.find((x) => x.boxes.length) ?? null;
const at = (t: Tally | null) => (t ? { selector: t.selectors[0], box: t.boxes[0] } : null);
const SINGLE_PAGE = 'Only this page was read, so this compares instances within its first screen.';

/* ============================================================ preflight */

export type Preflight = {
  type: { modular: boolean; base: number | null; ratio: number | null; share: number; off: Tally[] };
  spacing: { unit: number | null; share: number; off: Tally[] };
  rampColors: Set<string>;
  shadowRamp: boolean;
};

// Ratios under 1.125 put a step every few per cent, which any set of sizes would "fit".
const RATIOS = [1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618];
const cache = new WeakMap<Measured, Preflight>();

/**
 * The catalog's preflight: for each dimension, does the page follow a scale of
 * its own? Where 70% of uses sit on one, deviations are measured against it.
 */
export function preflight(m: Measured, inv: Inventory): Preflight {
  const hit = cache.get(m);
  if (hit) return hit;

  /* type: a modular scale from one of the common bases */
  const sizes = inv.fontSizes.filter((t) => t.px);
  const totalSizes = sizes.reduce((a, t) => a + t.count, 0) || 1;
  let type: Preflight['type'] = { modular: false, base: null, ratio: null, share: 0, off: sizes };
  for (const base of sizes.slice(0, 3).map((t) => t.px!)) {
    for (const r of RATIOS) {
      const on = (v: number) => {
        for (let k = -3; k <= 8; k += 1) if (Math.abs(v - base * r ** k) / v <= 0.02) return true;
        return false;
      };
      const share = sizes.filter((t) => on(t.px!)).reduce((a, t) => a + t.count, 0) / totalSizes;
      if (share > type.share) type = { modular: share >= 0.7 && sizes.length >= 4, base, ratio: r, share, off: sizes.filter((t) => !on(t.px!)) };
    }
  }

  /* spacing: the largest unit 70% of declarations divide by */
  const sp = inv.spacing.filter((t) => t.px);
  const totalSp = sp.reduce((a, t) => a + t.count, 0) || 1;
  let spacing: Preflight['spacing'] = { unit: null, share: 0, off: sp };
  for (const u of [8, 6, 5, 4]) {
    const on = (v: number) => Math.abs(v / u - Math.round(v / u)) * u <= 0.5;
    const share = sp.filter((t) => on(t.px!)).reduce((a, t) => a + t.count, 0) / totalSp;
    if (share >= 0.7) {
      spacing = { unit: u, share, off: sp.filter((t) => !on(t.px!)) };
      break;
    }
    if (share > spacing.share) spacing = { unit: null, share, off: sp };
  }

  /* colour: evenly spaced lightness ramps within one hue (or the neutrals) */
  const colours = [...new Set([...inv.colors.text, ...inv.colors.background, ...inv.colors.border].map((t) => t.value))];
  const groups = new Map<string, { hex: string; L: number }[]>();
  for (const hex of colours) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;
    const c = oklch(rgb);
    const key = c.C < 0.03 ? 'neutral' : `h${Math.round(c.h / 20)}`;
    groups.set(key, [...(groups.get(key) ?? []), { hex, L: c.L }]);
  }
  const rampColors = new Set<string>();
  for (const g of groups.values()) {
    if (g.length < 4) continue;
    const Ls = g.map((x) => x.L).sort((a, b) => a - b);
    const steps = Ls.slice(1).map((v, i) => v - Ls[i]);
    const mean = steps.reduce((a, v) => a + v, 0) / steps.length;
    if (mean > 0 && steps.every((s) => s >= mean * 0.5 && s <= mean * 1.6)) g.forEach((x) => rampColors.add(x.hex));
  }

  /* shadows: one light source, blur growing in proportion to offset */
  const parsed = inv.shadows.map((t) => {
    const layers = t.value.split(/,(?![^(]*\))/).map((l) => (l.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, '').match(/-?[\d.]+px/g) || []).map(parseFloat));
    return layers.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0] ?? [];
  });
  const ratios = parsed.filter((p) => p.length >= 3 && p[1] > 0).map((p) => p[2] / p[1]);
  const med = [...ratios].sort((a, b) => a - b)[Math.floor(ratios.length / 2)] ?? 0;
  const shadowRamp =
    parsed.length >= 2 &&
    ratios.length === parsed.length &&
    parsed.every((p) => Math.abs(p[0]) <= 0.5 && p[1] > 0) &&
    ratios.every((r) => Math.abs(r - med) <= med * 0.35);

  const result = { type, spacing, rampColors, shadowRamp };
  cache.set(m, result);
  return result;
}

/* ========================================================= inventories */

function tiered(n: number, warn: number, fail: number): SeverityLevel | null {
  return n > fail ? 'medium' : n > warn ? 'low' : null;
}

const UI_001: Evaluator = (ctx) => {
  const ruleId = 'UI-001';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  const n = inv.fontSizes.length;
  if (!n) return notApplicable(ruleId, 'No text on the first screen.');
  const pf = preflight(ctx.measured!, inv);
  const scale = pf.type.modular ? `a ${pf.type.ratio} modular scale from ${pf.type.base}px (${pct(pf.type.share)} of text on it)` : null;
  const sev = tiered(n, 8, 12);
  if (!sev || (pf.type.modular && !pf.type.off.length)) {
    const t = first(inv.fontSizes)!;
    return {
      ruleId,
      status: 'pass',
      checked: n,
      note: scale && sev ? `All ${n} font sizes sit on ${scale}.` : `The first screen uses ${plural(n, 'font size')}${scale ? `, on ${scale}` : ''}.`,
      evidence: elEvidence(at(t)!, `${n} distinct sizes`, 'at most 8'),
    };
  }
  const orphans = (pf.type.modular ? pf.type.off : inv.fontSizes).slice().sort((a, b) => b.count - a.count);
  const inst = atElement(
    at(first(orphans) ?? first(inv.fontSizes))!,
    `${n} distinct font sizes on the first screen${scale ? `; ${plural(orphans.length, 'size')} fall off ${scale}` : ''}`,
    sev === 'medium' ? 'at most 12 distinct sizes, ideally 6–8' : 'at most 8 distinct sizes',
    {
      font_size_inventory: inv.fontSizes.map((t) => t.value),
      usage_counts: counts(inv.fontSizes),
      top_offending_selectors: orphans.slice(0, 5).map((t) => `${t.value}: ${t.selectors[0]}`),
    },
    { confidence: 0.92, rootCause: 'type-scale', severity: sev },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: n } : notEvaluated(ruleId, 'The offending text is outside the first screen.');
};

const UI_002: Evaluator = (ctx) => {
  const ruleId = 'UI-002';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const w = u.value.inventory.fontWeights;
  if (!w.length) return notApplicable(ruleId, 'No text on the first screen.');
  if (w.length <= 4) {
    return { ruleId, status: 'pass', checked: w.length, note: `Text uses ${plural(w.length, 'font weight')} (${w.map((t) => t.value).join(', ')}).`, evidence: elEvidence(at(first(w))!, `${w.length} weights`, 'at most 4') };
  }
  const rare = w.filter((t) => t.count < 5).sort((a, b) => a.count - b.count);
  const inst = atElement(
    at(first(rare.length ? rare : w))!,
    `${w.length} distinct font weights: ${w.map((t) => t.value).join(', ')}`,
    'at most 4 weights (400 / 500 / 600 / 700)',
    { weight_inventory: w.map((t) => t.value), usage_counts: counts(w) },
    { confidence: 0.93, rootCause: 'weights' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: w.length } : notEvaluated(ruleId, 'The offending text is outside the first screen.');
};

const UI_003: Evaluator = (ctx) => {
  const ruleId = 'UI-003';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  // Stacks that lead with the same typeface are one family with different
  // fallbacks; what costs a download and reads as a third voice is the typeface.
  const stacks = u.value.inventory.fontFamilies.filter((f) => !f.codeOnly && !f.icon);
  const byFace = new Map<string, Tally>();
  for (const s of stacks) {
    const face = s.value.split(',')[0].trim();
    const held = byFace.get(face);
    if (held) held.count += s.count;
    else byFace.set(face, { ...s, value: face });
  }
  const fams = [...byFace.values()].sort((a, b) => b.count - a.count);
  if (!fams.length) return notApplicable(ruleId, 'No text on the first screen.');
  if (fams.length <= 2) {
    return { ruleId, status: 'pass', checked: fams.length, note: `Text uses ${plural(fams.length, 'typeface')}: ${fams.map((f) => f.value).join(', ')}.`, evidence: elEvidence(at(first(fams))!, `${fams.length} families`, 'at most 2') };
  }
  const orphan = fams[fams.length - 1];
  const inst = atElement(
    at(orphan)!,
    `${fams.length} font families: ${fams.map((f) => `${f.value.split(',')[0]} ×${f.count}`).join(', ')}`,
    'one display family and one text family',
    { family_inventory: fams.map((f) => f.value), selectors: fams.map((f) => `${f.value.split(',')[0]}: ${f.selectors[0]}`), page_map: 'this page only' },
    { confidence: 0.92, rootCause: 'families' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: fams.length } : notEvaluated(ruleId, 'The offending text is outside the first screen.');
};

const UI_004: Evaluator = (ctx) => {
  const ruleId = 'UI-004';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  const distinct = inv.spacing.length;
  if (!distinct) return notApplicable(ruleId, 'No margins or padding on the first screen.');
  const pf = preflight(ctx.measured!, inv);
  const unit = pf.spacing.unit;
  const offDecl = unit ? pf.spacing.off.reduce((a, t) => a + t.count, 0) : 0;
  const share = unit ? offDecl / Math.max(1, inv.spacingDeclarations) : 0;
  let sev: SeverityLevel | null = null;
  if (distinct > 14) sev = 'medium';
  if (unit) sev = share > 0.3 || distinct > 14 ? 'medium' : share > 0.15 ? 'low' : sev;
  if (!unit && distinct <= 10) sev = null;
  if (!sev) {
    const t = first(inv.spacing)!;
    return {
      ruleId,
      status: 'pass',
      checked: inv.spacingDeclarations,
      note: unit
        ? `Spacing keeps to a ${unit}px scale: ${pct(1 - share)} of ${inv.spacingDeclarations} margin and padding values sit on it.`
        : `No baseline scale was detected, but spacing uses only ${plural(distinct, 'distinct value')}.`,
      evidence: elEvidence(at(t)!, unit ? `${pct(1 - share)} on a ${unit}px scale` : `${distinct} spacing values`, unit ? 'at least 85% on scale' : 'at most 10 values with no scale'),
    };
  }
  const offenders = (unit ? pf.spacing.off : inv.spacing).slice().sort((a, b) => b.count - a.count);
  const top5 = offenders.slice(0, 5).map((t) => `${t.value} (×${t.count})`).join(', ');
  const inst = atElement(
    at(first(offenders))!,
    unit
      ? `${pct(share)} of spacing values are off the page's own ${unit}px scale; ${distinct} distinct values`
      : `${distinct} distinct spacing values and no baseline scale`,
    unit ? 'at most 15% off-scale and no more than 14 distinct values' : 'a baseline scale, or no more than 14 distinct values',
    {
      spacing_inventory: inv.spacing.map((t) => t.value),
      off_scale_values: offenders.map((t) => t.value),
      usage_counts: counts(offenders),
      selectors: offenders.slice(0, 5).map((t) => `${t.value}: ${t.selectors[0]}`),
    },
    {
      confidence: 0.88,
      rootCause: 'spacing',
      severity: sev,
      fixVars: {
        baseline_unit: unit ? `${unit}px` : '4px (no scale of the page’s own was found; this is a starting point)',
        top_5: top5,
      },
    },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: inv.spacingDeclarations } : notEvaluated(ruleId, 'The offending elements are outside the first screen.');
};

function clusters(hexes: string[]): { members: string[]; worst: number }[] {
  const out: { members: string[]; worst: number }[] = [];
  const used = new Set<string>();
  for (const a of hexes) {
    if (used.has(a)) continue;
    const ra = hexToRgb(a)!;
    const members = [a];
    let worst = 0;
    for (const b of hexes) {
      if (b === a || used.has(b)) continue;
      const d = deltaE(ra, hexToRgb(b)!);
      if (d < 3) {
        members.push(b);
        worst = Math.max(worst, d);
      }
    }
    if (members.length > 1) {
      members.forEach((m) => used.add(m));
      out.push({ members, worst: Math.round(worst * 10) / 10 });
    }
  }
  return out;
}

const UI_005: Evaluator = (ctx) => {
  const ruleId = 'UI-005';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  const tally = new Map<string, Tally>();
  for (const t of [...inv.colors.text, ...inv.colors.background, ...inv.colors.border]) {
    const held = tally.get(t.value);
    if (held) held.count += t.count;
    else tally.set(t.value, { ...t, selectors: [...t.selectors], boxes: [...t.boxes] });
  }
  const all = [...tally.values()].sort((a, b) => b.count - a.count);
  const n = all.length;
  if (!n) return notApplicable(ruleId, 'No colours on the first screen.');
  const pf = preflight(ctx.measured!, inv);
  const onRamp = all.filter((t) => pf.rampColors.has(t.value)).length;
  const sev = tiered(n, 20, 32);
  const dupes = clusters(all.map((t) => t.value));
  if (!sev || onRamp / n >= 0.7) {
    return {
      ruleId,
      status: 'pass',
      checked: n,
      note: sev ? `${n} colours, ${pct(onRamp / n)} of them steps on evenly spaced ramps.` : `The first screen uses ${plural(n, 'distinct colour')}.`,
      evidence: elEvidence(at(first(all))!, `${n} colours`, 'at most 20'),
    };
  }
  const report = dupes.length ? dupes.slice(0, 8).map((c) => `${c.members.join(' ≈ ')} (ΔE ≤ ${c.worst})`).join('; ') : 'none within ΔE 3 — the sprawl is distinct colours';
  const inst = atElement(
    at(first(all))!,
    `${n} distinct colours across text, backgrounds and borders; ${plural(dupes.length, 'near-duplicate cluster')}`,
    sev === 'medium' ? 'at most 32, ideally a brand ramp, a neutral ramp and 4 semantic colours' : 'at most 20',
    {
      color_inventory: all.map((t) => t.value),
      usage_counts: counts(all),
      near_duplicate_clusters: dupes.map((c) => c.members.join(' ≈ ')),
    },
    { confidence: 0.87, rootCause: 'palette', severity: sev, fixVars: { cluster_report: report } },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: n } : notEvaluated(ruleId, 'The offending elements are outside the first screen.');
};

const UI_006: Evaluator = (ctx) => {
  const ruleId = 'UI-006';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  const pairs: { role: string; a: Tally; b: Tally; d: number }[] = [];
  for (const [role, list] of [['text', inv.colors.text], ['background', inv.colors.background], ['border', inv.colors.border]] as const) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        // Translucent tokens compare only with tokens of the same opacity.
        if ((list[i].value.slice(7) || 'FF') !== (list[j].value.slice(7) || 'FF')) continue;
        const d = deltaE(hexToRgb(list[i].value)!, hexToRgb(list[j].value)!);
        if (d > 0 && d < 3) pairs.push({ role, a: list[i], b: list[j], d: Math.round(d * 100) / 100 });
      }
    }
  }
  const checked = inv.colors.text.length + inv.colors.background.length + inv.colors.border.length;
  if (!checked) return notApplicable(ruleId, 'No colours on the first screen.');
  if (pairs.length < 3) {
    return {
      ruleId,
      status: 'pass',
      checked,
      note: pairs.length ? `Only ${plural(pairs.length, 'near-duplicate pair')} of colours in the same role.` : 'No two colours in the same role are near-duplicates.',
      evidence: elEvidence(at(first(inv.colors.text) ?? first(inv.colors.background))!, `${pairs.length} near-duplicate pairs`, 'fewer than 3'),
    };
  }
  const worst = pairs.sort((x, y) => x.d - y.d);
  const inst = atElement(
    at(worst[0].b)!,
    `${pairs.length} pairs of colours used in the same role that are visually identical, e.g. ${worst[0].a.value} and ${worst[0].b.value} as ${worst[0].role} (ΔE ${worst[0].d})`,
    'one value per role where two are indistinguishable',
    {
      color_pairs: worst.slice(0, 10).map((p) => `${p.role}: ${p.a.value} (×${p.a.count}) / ${p.b.value} (×${p.b.count})`),
      deltaE_values: worst.slice(0, 10).map((p) => p.d),
      selectors: worst.slice(0, 5).map((p) => `${p.b.value}: ${p.b.selectors[0]}`),
    },
    { confidence: 0.92, rootCause: 'near-duplicates' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked } : notEvaluated(ruleId, 'The offending elements are outside the first screen.');
};

const UI_007: Evaluator = (ctx) => {
  const ruleId = 'UI-007';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  if (!inv.radii.length) return notApplicable(ruleId, 'No rounded corners on the first screen, other than fully round ones.');
  const counted = inv.radii.filter((t) => !inv.concentricRadii.includes(t.value));
  if (counted.length <= 4) {
    return {
      ruleId,
      status: 'pass',
      checked: inv.radii.length,
      note: `Corners use ${plural(counted.length, 'radius', 'radii')} (${inv.radii.map((t) => t.value).join(', ')})${inv.concentricRadii.length ? ', with nested corners following the concentric rule' : ''}.`,
      evidence: elEvidence(at(first(inv.radii))!, `${counted.length} radii`, 'at most 4'),
    };
  }
  const rare = [...counted].sort((a, b) => a.count - b.count);
  const inst = atElement(
    at(first(rare))!,
    `${counted.length} distinct corner radii: ${counted.map((t) => t.value).join(', ')}`,
    'at most 4: 4 / 8 / 16 / full',
    { radius_inventory: inv.radii.map((t) => t.value), usage_counts: counts(inv.radii), selectors: rare.slice(0, 5).map((t) => `${t.value}: ${t.selectors[0]}`) },
    { confidence: 0.92, rootCause: 'radii' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: inv.radii.length } : notEvaluated(ruleId, 'The offending elements are outside the first screen.');
};

const UI_008: Evaluator = (ctx) => {
  const ruleId = 'UI-008';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const inv = u.value.inventory;
  if (!inv.shadows.length) return notApplicable(ruleId, 'No shadows on the first screen.');
  const pf = preflight(ctx.measured!, inv);
  if (inv.shadows.length <= 4 || pf.shadowRamp) {
    return {
      ruleId,
      status: 'pass',
      checked: inv.shadows.length,
      note: pf.shadowRamp && inv.shadows.length > 4 ? `${inv.shadows.length} shadows form one elevation ramp: a single light source, blur in proportion to offset.` : `The first screen uses ${plural(inv.shadows.length, 'shadow')}.`,
      evidence: elEvidence(at(first(inv.shadows))!, `${inv.shadows.length} shadows`, 'at most 4, or one ramp'),
    };
  }
  const rare = [...inv.shadows].sort((a, b) => a.count - b.count);
  const inst = atElement(
    at(first(rare))!,
    `${inv.shadows.length} distinct box-shadows that do not form one elevation ramp`,
    'at most 4 levels: resting, hover, popover, modal',
    { shadow_inventory: inv.shadows.map((t) => t.value), usage_counts: inv.shadows.map((t) => t.count), selectors: rare.slice(0, 5).map((t) => t.selectors[0]) },
    { confidence: 0.92, rootCause: 'shadows' },
  );
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: inv.shadows.length } : notEvaluated(ruleId, 'The offending elements are outside the first screen.');
};

/* ============================================================== buttons */

const variantOf = (b: UiFacts['buttons'][number]) => `${b.fill ?? 'no fill'} / ${b.borderWidth ? 'border' : 'no border'} / ${b.fontWeight >= 600 ? 'bold' : 'regular'}`;
const weightOf = (b: UiFacts['buttons'][number]) =>
  (b.fill === 'gradient' ? 1 : b.fill ? Math.min(1, (b.fillContrast - 1) / 3) : 0) + (b.borderWidth ? Math.min(0.4, (b.borderContrast - 1) / 5) : 0) + (b.fontWeight >= 600 ? 0.1 : 0);

const UI_009: Evaluator = (ctx) => {
  const ruleId = 'UI-009';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const buttons = u.value.buttons.filter((b) => !b.tierCard);
  const variants = new Map<string, typeof buttons>();
  for (const b of buttons) variants.set(variantOf(b), [...(variants.get(variantOf(b)) ?? []), b]);
  if (variants.size < 2) return notApplicable(ruleId, variants.size ? 'Only one button variant is on the first screen.' : 'No buttons on the first screen.');
  const ranked = [...variants.entries()].map(([k, list]) => ({ k, list, w: weightOf(list[0]) })).sort((a, b) => b.w - a.w);
  const primary = ranked[0];
  if (primary.w <= 0) return notApplicable(ruleId, 'No button on the first screen is filled, so there is no primary to compare against.');
  const instances: Instance[] = [];
  for (const sec of ranked.slice(1)) {
    const delta = (primary.w - sec.w) / primary.w;
    if (delta >= 0.15) continue;
    // Hierarchy is a choice between buttons seen together; a header button and
    // a chat widget's are not competing for one decision.
    const pair = primary.list.flatMap((p) => sec.list.filter((x) => x.region === p.region).map((s) => ({ p, s })))[0];
    if (!pair) continue;
    const { p, s } = pair;
    const signals = [
      `combined visual weight differs by only ${pct(delta)} (${primary.w.toFixed(2)} vs ${sec.w.toFixed(2)})`,
      'the two sit together in one region, where a user must choose between them',
    ];
    if (Math.abs(s.height - p.height) <= 2) signals.push(`the same height (${p.height}px)`);
    const box = union([p.box, s.box]);
    if (!box) continue;
    const inst = atElement(
      { selector: `${p.selector}, ${s.selector}`, box },
      `Primary "${p.label}" (${primary.k}) and secondary "${s.label}" (${sec.k}) differ in visual weight by ${pct(delta)}`,
      'a combined weight difference of at least 15%: solid primary, outlined secondary',
      {
        selector_pair: [p.selector, s.selector],
        computed_styles: [p, s].map((b) => `"${b.label}": fill ${b.fill ?? 'none'} (${b.fillContrast}:1), border ${b.borderWidth}px, weight ${b.fontWeight}`),
        weight_scores: [Math.round(primary.w * 100) / 100, Math.round(sec.w * 100) / 100],
      },
      { confidence: 0.8, rootCause: `${primary.k} vs ${sec.k}`, signals },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: variants.size };
  const p = primary.list[0];
  return {
    ruleId,
    status: 'pass',
    checked: variants.size,
    note: `${variants.size} button variants on the first screen, and the primary ("${p.label}") outweighs the next by at least 15%.`,
    evidence: elEvidence(p, `primary "${p.label}" weight ${primary.w.toFixed(2)}, next ${ranked[1].w.toFixed(2)}`, 'at least 15% apart'),
  };
};

const UI_010: Evaluator = (ctx) => {
  const ruleId = 'UI-010';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const buttons = u.value.buttons.filter((b) => !b.sizeClass);
  const groups = new Map<string, typeof buttons>();
  for (const b of buttons) groups.set(variantOf(b), [...(groups.get(variantOf(b)) ?? []), b]);
  const comparable = [...groups.values()].filter((g) => g.length >= 2);
  if (!comparable.length) return notApplicable(ruleId, `No button variant appears twice on the first screen. ${SINGLE_PAGE}`);
  const instances: Instance[] = [];
  const dims = ['height', 'paddingX', 'radius', 'fontSize'] as const;
  for (const g of comparable) {
    const ref = g[0];
    const odd = g.filter((b) => b !== ref && b.context === ref.context).map((b) => ({
      b,
      deltas: dims
        .filter((d) => Math.abs(b[d] - ref[d]) > 0.1 * Math.max(b[d], ref[d]) && Math.abs(b[d] - ref[d]) >= 1)
        .map((d) => `${d} ${ref[d]}px vs ${b[d]}px`),
    })).filter((x) => x.deltas.length);
    if (!odd.length) continue;
    const members = [ref, ...odd.map((x) => x.b)];
    const map = members.map((b) => `"${b.label}" ${b.selector} (${b.height}px high, ${b.paddingX}px padding, ${b.radius}px radius, ${b.fontSize}px text)`);
    const box = union(members.map((b) => b.box));
    if (!box) continue;
    const inst = atElement(
      { selector: members.map((b) => b.selector).join(', '), box },
      `${members.length} instances of the same button variant (${variantOf(ref)}) differ: ${odd[0].deltas.join(', ')}`,
      'one component: the same height, padding, radius and text size, or a named size variant',
      {
        component_id: `button: ${variantOf(ref)}`,
        instance_map: map,
        style_deltas: odd.flatMap((x) => x.deltas.map((d) => `"${x.b.label}": ${d}`)),
        screenshot_bbox_set: members.map((b) => `${b.box.x},${b.box.y},${b.box.w},${b.box.h}`),
      },
      { confidence: 0.82, rootCause: variantOf(ref), fixVars: { instance_map: map.join('; ') } },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: comparable.length, note: SINGLE_PAGE };
  return {
    ruleId,
    status: 'pass',
    checked: comparable.length,
    note: `Repeated buttons render identically (${plural(comparable.length, 'variant')} compared). ${SINGLE_PAGE}`,
    evidence: elEvidence(comparable[0][0], `${comparable[0].length} matching instances`, 'identical instances'),
  };
};

/* ============================================================== layout */

const UI_011: Evaluator = (ctx) => {
  const ruleId = 'UI-011';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const groups = u.value.align;
  if (groups.length < 3) {
    return {
      ruleId,
      status: 'pass',
      checked: groups.length,
      note: groups.length ? `Only ${plural(groups.length, 'group')} on the first screen drift by 1–6px, below the threshold of 3.` : 'Sibling elements on the first screen share their edges.',
      evidence: docEvidence('body', `${groups.length} drifting groups`, 'fewer than 3'),
    };
  }
  const instances = groups
    .map((g) =>
      atElement(
        { selector: g.selectors.join(', '), box: g.box },
        `Siblings in ${g.parent} are ${g.delta}px off a shared ${g.axis} edge`,
        `one shared ${g.axis} edge`,
        { selector_group: g.selectors, edge_positions: g.edges, deltas: [g.delta] },
        { confidence: 0.82, rootCause: 'alignment' },
      ),
    )
    .filter((i): i is Instance => !!i);
  return instances.length >= 3 ? { ruleId, status: 'fail', instances, checked: groups.length } : notEvaluated(ruleId, 'The drifting groups are outside the first screen.');
};

const UI_012: Evaluator = (ctx) => {
  const ruleId = 'UI-012';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const cs = u.value.containers;
  if (!cs.length) return notApplicable(ruleId, 'No centred content container with a max-width on the first screen.');
  const widths = [...new Set(cs.map((c) => c.maxWidth))].sort((a, b) => a - b);
  if (widths.length < 3) {
    return { ruleId, status: 'pass', checked: cs.length, note: `Content containers use ${plural(widths.length, 'width')} (${widths.map((w) => `${w}px`).join(', ')}). ${SINGLE_PAGE}`, evidence: elEvidence(cs[0], `max-width ${cs[0].maxWidth}px`, 'at most 2–3 container widths') };
  }
  const box = union(cs.map((c) => c.box));
  const inst = box
    ? atElement(
        { selector: cs.map((c) => c.selector).join(', '), box },
        `${widths.length} different content container widths on one screen: ${widths.map((w) => `${w}px`).join(', ')}`,
        'two or three container widths, chosen by layout type',
        { container_map: cs.map((c) => `${c.selector}: ${c.maxWidth}px`), widths, page_map: 'this page only' },
        { confidence: 0.85, rootCause: 'containers' },
      )
    : null;
  return inst ? { ruleId, status: 'fail', instances: [inst], checked: cs.length, note: SINGLE_PAGE } : notEvaluated(ruleId, 'The containers are outside the first screen.');
};

const UI_013: Evaluator = (ctx) => {
  const ruleId = 'UI-013';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const groups = u.value.dense;
  if (!groups.length) return notApplicable(ruleId, 'No repeated groups of content on the first screen.');
  const instances: Instance[] = [];
  for (const g of groups) {
    const tight = g.groupGap < 16 && g.innerGap >= 8 && g.groupGap < 2 * g.innerGap;
    if (!tight) continue;
    const signals = [`${g.groupGap}px between groups against ${g.innerGap}px inside them`];
    if (g.density >= 0.35) signals.push(`ink covers ${pct(g.density)} of the area`);
    const inst = atElement(
      g.parent,
      `${g.count} groups separated by ${g.groupGap}px while items inside sit ${g.innerGap}px apart; ink covers ${pct(g.density)}`,
      `at least 16px, and twice the inner gap (${g.innerGap * 2}px), between groups`,
      { gap_measurements: [`between groups ${g.groupGap}px`, `inside a group ${g.innerGap}px`], density_ratio: g.density },
      { confidence: 0.78, rootCause: g.parent.selector, signals },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: groups.length };
  return { ruleId, status: 'pass', checked: groups.length, note: 'Repeated groups are separated by more space than sits inside them.', evidence: elEvidence(groups[0].parent, `${groups[0].groupGap}px between, ${groups[0].innerGap}px inside`, 'group gap at least twice the inner gap') };
};

/* =============================================================== type */

const UI_014: Evaluator = (ctx) => {
  const ruleId = 'UI-014';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const ls = u.value.leading.filter((l) => l.fontSize < 20 || l.fontSize >= 24);
  if (!ls.length) return notApplicable(ruleId, 'No multi-line text on the first screen.');
  const instances: Instance[] = [];
  for (const l of ls) {
    const body = l.fontSize < 20;
    const bad = body ? l.ratio < 1.4 || l.ratio > 1.8 : l.ratio < 1.05 || l.ratio > 1.4;
    if (!bad) continue;
    const inst = atElement(
      l,
      `${body ? 'Body text' : 'Heading'} at ${l.fontSize}px with ${l.lineHeight}px line height (${l.ratio}) across ${l.lines} lines`,
      body ? 'a ratio between 1.4 and 1.8' : 'a ratio between 1.05 and 1.4',
      { font_size: l.fontSize, computed_line_height: l.lineHeight, ratio: l.ratio },
      { confidence: 0.92, rootCause: `${l.fontSize}px/${l.lineHeight}px` },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: ls.length };
  const r = ls.map((l) => l.ratio);
  return { ruleId, status: 'pass', checked: ls.length, note: `Multi-line text sits at line-height ratios of ${Math.min(...r)}–${Math.max(...r)}, inside the readable range.`, evidence: elEvidence(ls[0], `ratio ${ls[0].ratio}`, 'readable range') };
};

const UI_015: Evaluator = (ctx) => {
  const ruleId = 'UI-015';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const items = u.value.imageText;
  if (!items.length) return notApplicable(ruleId, 'No text sits on an image on the first screen.');
  const s = ctx.measured!.imageText;
  if (!s.ok) return notEvaluated(ruleId, `The image under the text could not be sampled: ${s.error}`);
  const samples = new Map(s.value.map((x) => [x.id, x]));
  const instances: Instance[] = [];
  let checked = 0;
  let best: { it: (typeof items)[number]; p10: number } | null = null;
  for (const it of items) {
    const smp = samples.get(it.id);
    if (!smp) continue;
    checked += 1;
    if (smp.p10 >= 4.5) {
      if (!best || smp.p10 > best.p10) best = { it, p10: smp.p10 };
      continue;
    }
    const inst = atElement(
      it,
      `Text ${it.color} on an image${it.overlay ? ' with a partial overlay' : ' with no scrim or backing'}: contrast falls to ${smp.p10}:1 across the image behind it (lowest ${smp.min}:1)`,
      'at least 4.5:1 at every point, from a scrim or a solid panel',
      { sampled_contrast_min: smp.p10, image_src: it.imageSrc },
      { confidence: it.overlay ? 0.84 : 0.88, rootCause: it.imageSrc },
    );
    if (inst) instances.push(inst);
  }
  if (!checked) return notEvaluated(ruleId, 'The text over images was too small, or covered too much of its box, to sample the image around it.');
  if (instances.length) return { ruleId, status: 'fail', instances, checked };
  return { ruleId, status: 'pass', checked, note: `Text over images keeps at least ${best!.p10}:1 against the image behind it.`, evidence: elEvidence(best!.it, `sampled ${best!.p10}:1`, 'at least 4.5:1') };
};

/* ============================================================= imagery */

const UI_016: Evaluator = (ctx) => {
  const ruleId = 'UI-016';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const icons = u.value.icons;
  if (icons.length < 2) return notApplicable(ruleId, 'Fewer than two inline SVG icons on the first screen.');
  const outlines = icons.filter((i) => i.style === 'outline' && i.stroke != null);
  const strokes = [...new Set(outlines.map((i) => i.stroke!))];
  const instances: Instance[] = [];
  if (strokes.length >= 2) {
    const byStroke = strokes.map((s) => ({ s, list: outlines.filter((i) => i.stroke === s) })).sort((a, b) => a.list.length - b.list.length);
    const odd = byStroke[0].list;
    const inst = atElement(
      odd[0],
      `Outline icons in ${strokes.length} stroke weights on a 24px grid: ${byStroke.map((x) => `${x.s}px ×${x.list.length}`).join(', ')}`,
      'one stroke weight, 1.5px or 2px on a 24px grid',
      { icon_map: outlines.slice(0, 12).map((i) => `${i.selector}: ${i.stroke}px`), stroke_widths: strokes, styles: ['outline'] },
      { confidence: 0.78, rootCause: 'stroke', fixVars: { icon_list: odd.slice(0, 6).map((i) => i.selector).join(', ') } },
    );
    if (inst) instances.push(inst);
  }
  const groups = new Map<string, typeof icons>();
  for (const i of icons) groups.set(i.group, [...(groups.get(i.group) ?? []), i]);
  for (const [group, list] of groups) {
    if (!group) continue; // icons with no shared set of controls are not a functional group
    const styles = new Set(list.map((i) => i.style));
    if (styles.size < 2) continue;
    const filled = list.filter((i) => i.style === 'filled');
    const outline = list.filter((i) => i.style === 'outline');
    const odd = filled.length <= outline.length ? filled : outline;
    const inst = atElement(
      odd[0],
      `Filled and outline icons mixed in ${group}: ${filled.length} filled, ${outline.length} outline`,
      'one style within a group',
      { icon_map: list.slice(0, 12).map((i) => `${i.selector}: ${i.style}`), stroke_widths: strokes, styles: [...styles] },
      { confidence: 0.76, rootCause: `mixed:${group}`, fixVars: { icon_list: odd.slice(0, 6).map((i) => i.selector).join(', ') } },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: icons.length };
  return { ruleId, status: 'pass', checked: icons.length, note: `${plural(icons.length, 'icon')} on the first screen share one style${strokes.length === 1 ? ` and a ${strokes[0]}px stroke` : ''}.`, evidence: elEvidence(icons[0], `${icons[0].style}${icons[0].stroke ? `, ${icons[0].stroke}px` : ''}`, 'one icon style') };
};

const UI_017: Evaluator = (ctx) => {
  const ruleId = 'UI-017';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const imgs = u.value.images;
  if (!imgs.length) return notApplicable(ruleId, 'No raster images on the first screen.');
  const instances: Instance[] = [];
  for (const i of imgs) {
    if (['cover', 'contain', 'scale-down', 'none'].includes(i.objectFit)) continue;
    const dev = Math.abs(i.rendered / i.natural - 1);
    if (dev <= 0.02) continue;
    const inst = atElement(
      i,
      `Image drawn at ${i.rendered} width-to-height against its source's ${i.natural}: ${pct(dev)} ${i.rendered > i.natural ? 'stretched' : 'squashed'}`,
      'the source ratio within 2%, or object-fit: cover',
      { natural_ratio: i.natural, rendered_ratio: i.rendered, image_src: i.src },
      { confidence: 0.94, rootCause: i.src },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: imgs.length };
  return { ruleId, status: 'pass', checked: imgs.length, note: `${plural(imgs.length, 'image')} on the first screen keep their source proportions.`, evidence: elEvidence(imgs[0], `ratio ${imgs[0].rendered} vs ${imgs[0].natural}`, 'within 2%') };
};

/* ============================================================== states */

const UI_018: Evaluator = (ctx) => {
  const ruleId = 'UI-018';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  if (!u.value.interactive.length) return notApplicable(ruleId, 'No interactive elements on the first screen.');
  const s = ctx.measured!.states;
  if (!s.ok) return notEvaluated(ruleId, `Hover and press could not be tested: ${s.error}`);
  // Each tested element stands for every element sharing its markup, so the
  // share is of elements on the screen, not of the samples taken.
  const tested = s.value.items.filter((i) => i.hover != null && i.active != null);
  const total = tested.reduce((a, i) => a + i.count, 0);
  if (total < 3) return notEvaluated(ruleId, `Only ${plural(total, 'element')} could be hovered and put in a pressed state${s.value.stopped ? ` (${s.value.stopped})` : ''}.`);
  const missing = tested.filter((i) => !i.hover || !i.active);
  const missingCount = missing.reduce((a, i) => a + i.count, 0);
  const share = missingCount / total;
  const boxes = new Map(u.value.interactive.map((i) => [i.id, i.box]));
  if (share < 0.25) {
    const ok = tested.find((i) => i.hover && i.active) ?? tested[0];
    return { ruleId, status: 'pass', checked: total, note: `${pct(1 - share)} of ${total} interactive elements change on both hover and press.`, evidence: elEvidence({ selector: ok.selector, box: boxes.get(ok.id)! }, 'changes on hover and press', 'hover and active states') };
  }
  const map = tested.map((i) => `"${i.name}"${i.count > 1 ? ` and ${i.count - 1} like it` : ''}: hover ${i.hover ? 'yes' : 'no'}, press ${i.active ? 'yes' : 'no'}`);
  const instances = missing
    .slice(0, 12)
    .map((i) =>
      atElement(
        { selector: i.selector, box: boxes.get(i.id)! },
        `"${i.name}" shows no ${[!i.hover && 'hover', !i.active && 'pressed'].filter(Boolean).join(' or ')} state (${missingCount} of ${total} elements, ${pct(share)})`,
        'a visible hover and active state on every interactive element',
        {
          element_map: map,
          missing_states: [!i.hover && 'hover', !i.active && 'active'].filter(Boolean) as string[],
          selectors: missing.slice(0, 12).map((x) => x.selector),
        },
        // One root cause: the page's state coverage. Deducted once, however many elements show it.
        { confidence: 0.82, rootCause: 'state-coverage' },
      ),
    )
    .filter((x): x is Instance => !!x);
  return { ruleId, status: 'fail', instances, checked: total };
};

const UI_019: Evaluator = (ctx) => {
  const ruleId = 'UI-019';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const t = u.value.truncated;
  if (!t.length) return notApplicable(ruleId, 'No truncated text on the first screen.');
  const instances: Instance[] = [];
  for (const x of t) {
    if (x.recover) continue;
    const inst = atElement(
      x,
      `"${x.shown}" is cut off with no title, tooltip or expand control; the full text is "${x.full.slice(0, 80)}"`,
      'the full value available on hover or focus',
      { rendered_text: x.shown, full_text: x.full },
      // Inside a link the detail view may well show it in full; that is the catalog's exclusion.
      { confidence: x.inLink ? 0.7 : 0.86, rootCause: 'truncation' },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: t.length };
  return { ruleId, status: 'pass', checked: t.length, note: 'Truncated text on the first screen carries its full value in a title or tooltip.', evidence: elEvidence(t[0], 'truncated, with a title', 'a way to read the full value') };
};

const UI_020: Evaluator = (ctx) => {
  const ruleId = 'UI-020';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  if (!u.value.stress.length) return notApplicable(ruleId, 'No short text elements on the first screen to stress-test.');
  const s = ctx.measured!.stress;
  if (!s.ok) return notEvaluated(ruleId, `The stress test could not run: ${s.error}`);
  const instances = s.value.broken
    .map((b) =>
      atElement(
        b,
        `At ${b.factor}× its length, "${b.text.slice(0, 40)}" breaks: ${b.detail}`,
        'the container grows or wraps; nothing clipped or overlapping',
        { stress_test_screenshot: b.capture ?? 'not kept (only the first four breaks are captured)', overflow_type: b.overflow },
        { confidence: 0.76, rootCause: b.signature },
      ),
    )
    .filter((x): x is Instance => !!x);
  if (instances.length) return { ruleId, status: 'fail', instances, checked: s.value.tested };
  const c = u.value.stress[0];
  return { ruleId, status: 'pass', checked: s.value.tested, note: `${plural(s.value.tested, 'text element')} held their layout at twice and a third of their length.`, evidence: elEvidence(c, 'no overflow at 2× or 0.3×', 'layout holds') };
};

/* ================================================================ theme */

const UI_021: Evaluator = (ctx) => {
  const ruleId = 'UI-021';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const d = ctx.measured!.dark;
  if (!d.ok) return notEvaluated(ruleId, `The dark theme could not be tested: ${d.error}`);
  if (!d.value.declared.length) return notApplicable(ruleId, 'No dark theme is declared.');
  if (!d.value.applied) return notEvaluated(ruleId, `A dark theme is declared (${d.value.declared.join(', ')}), but switching it on did not darken the page.`);
  const instances = d.value.offenders
    .map((o) =>
      atElement(
        o,
        o.kind === 'light surface' ? `A ${o.value} surface stays light on the ${o.against} dark page` : `Text stays ${o.value} on ${o.against} in dark mode (${o.ratio}:1)`,
        'a themed token that changes with the theme',
        {
          hardcoded_values: [`${o.kind}: ${o.value}`],
          theme_context: `${d.value.applied}; page background ${d.value.pageBg}`,
          ...(o.capture ? { dark_mode_capture: o.capture } : {}),
        },
        { confidence: 0.86, rootCause: `${o.kind}:${o.value}` },
      ),
    )
    .filter((x): x is Instance => !!x);
  if (instances.length) return { ruleId, status: 'fail', instances, checked: d.value.declared.length };
  return {
    ruleId,
    status: 'pass',
    checked: d.value.declared.length,
    note: `With the dark theme on (${d.value.applied}), nothing on the first screen stays light or keeps dark text.`,
    evidence: docEvidence('html', `dark theme applied; page background ${d.value.pageBg}`, 'every surface and text colour themed'),
  };
};

const UI_022: Evaluator = (ctx) => {
  const ruleId = 'UI-022';
  const u = ui(ctx, ruleId);
  if (!u.ok) return u.outcome;
  const p = u.value.primary;
  if (!p) return notApplicable(ruleId, 'No h1 on the first screen to measure the hierarchy against.');
  if (p.contrast < 1.5) {
    return notEvaluated(ruleId, 'The headline is painted with a gradient or image (its text colour is transparent), so its contrast — and so its weight — is not a single measurable value.');
  }
  const instances: Instance[] = [];
  for (const h of u.value.heavy) {
    const signals = [`visual weight ${h.weight} against the headline's ${p.weight} (size, contrast and saturation)`, ...h.roles];
    const inst = atElement(
      h,
      `${h.text ? `"${h.text.slice(0, 50)}"` : h.selector} (${h.roles.join('; ') || 'secondary'}) outweighs the headline: ${h.weight} vs ${p.weight}`,
      'the primary message is the heaviest element in its region',
      { region_selector: h.region, weight_scores: [h.weight, p.weight], element_roles: [h.roles.join('; ') || 'not a heading', 'h1 (primary)'] },
      { confidence: 0.76, rootCause: h.selector, signals },
    );
    if (inst) instances.push(inst);
  }
  if (instances.length) return { ruleId, status: 'fail', instances, checked: u.value.heavy.length + 1 };
  return { ruleId, status: 'pass', checked: 1, note: `The headline carries the most visual weight in its region (${p.weight}).`, evidence: elEvidence(p, `weight ${p.weight}`, 'heaviest in its region') };
};

/* ================================================================ export */

export const UI_EVALUATORS: Record<string, Evaluator> = {
  'UI-001': UI_001,
  'UI-002': UI_002,
  'UI-003': UI_003,
  'UI-004': UI_004,
  'UI-005': UI_005,
  'UI-006': UI_006,
  'UI-007': UI_007,
  'UI-008': UI_008,
  'UI-009': UI_009,
  'UI-010': UI_010,
  'UI-011': UI_011,
  'UI-012': UI_012,
  'UI-013': UI_013,
  'UI-014': UI_014,
  'UI-015': UI_015,
  'UI-016': UI_016,
  'UI-017': UI_017,
  'UI-018': UI_018,
  'UI-019': UI_019,
  'UI-020': UI_020,
  'UI-021': UI_021,
  'UI-022': UI_022,
};

