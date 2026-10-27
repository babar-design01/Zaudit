import sharp from 'sharp';
import type Anthropic from '@anthropic-ai/sdk';
import type { FullPage, Measured } from './browser';
import { BANNED_PHRASES, type PageTypeResult } from './contract';
import type { Anchor } from './probe-anchors';
import { ask, describeModelError, modelAvailable } from './review';
import type { ExpertBucket, ExpertNote, Finding, Takeaways } from './types';

/**
 * The expert review: the page read the way the team's auditors read it.
 *
 * The measured checks are exact about what can be measured — contrast, target
 * sizes, landmarks. What an auditor leads with is different: two calls to
 * action that look equally important, a hero that splits attention, a slogan
 * that tells a visitor nothing, a form that asks too much at once. Those are
 * judgements, and this pass is where they are made.
 *
 * It is allowed to create findings, under three rules the code enforces:
 *
 *  1. **Anchored.** Every finding cites ids from the element map the browser
 *     took of the page. A finding that cites nothing real is dropped. The ids
 *     are what the report draws its marks from, so the marks land on the
 *     element the finding is about.
 *  2. **Labelled.** Each finding carries its confidence and is shown as
 *     "Expert review", apart from the measured ones.
 *  3. **Outside the score.** The score stays a measure of what was measured.
 *
 * The format is the team's own: a short theme title, then Issue, Impact and
 * Solution, sorted into Needs to be fixed / Needs improvement / Idea, with a
 * four-way takeaway (Good / Needs improvement / Needs to be fixed / Ideas) and
 * a statement of what the page is for, which every finding is judged against.
 */

/** The areas an auditor files a finding under, and the pillar each belongs to. */
export const AREAS: Record<string, string> = {
  'Visual hierarchy': 'hierarchy',
  'Calls to action': 'usability',
  'Copy & messaging': 'content',
  Navigation: 'ia',
  Forms: 'states',
  'Trust & credibility': 'content',
  'Layout & spacing': 'hierarchy',
  Mobile: 'hierarchy',
  'Imagery & media': 'content',
  Accessibility: 'accessibility',
};

const MIN_CONFIDENCE = 0.55;
const MAX_FINDINGS = 10;
/** Tiles of the full-page capture, each inside the model's 2576px long edge. */
const TILE_HEIGHT = 1800;
const MAX_TILES = 4;

/* --------------------------------------------------------------- prompt */

const SYSTEM = `You are a senior UX/UI auditor reviewing one web page for a client, the way an experienced design team does it by hand.

Start from what the page is for: state its goal in one sentence (what it must get a visitor to understand and do). Judge everything against that goal.

Lead with what a visitor feels first: where attention goes, whether one action is clearly primary, whether the copy says what is offered and why it matters, whether navigation offers a clear starting point, whether forms ask only what they need, whether anything competes with the main message (banners, panels, pop-ups), whether trust is earned before it is asked for, and how the page holds up on a phone. Technical faults (landmarks, metadata, heading tags) are already measured separately — do not repeat them.

Write each finding the team's way:
- title: a short theme, like "Fragmented hero focus (two first things at once)", "Nav lacks a task entry point", "Conflicting CTAs & unclear primary action", "Friction from a long single-step form".
- issue: what is wrong and where, naming the actual text, button or section on the page. One or two sentences.
- impact: what it costs the visitor or the business — hesitation, bounce, drop-off, missed value, lost trust. One sentence.
- solution: the specific change, with real copy, sizes or layout moves where they help (e.g. "Make 'Join the waitlist' the single filled CTA; demote 'Learn more' to a text link; add 'No credit card · 30s' under it."). Never write vague advice like "improve the UX" or "consider optimizing".
- bucket: "fix" (gets in the way of the page's goal), "improve" (works, but weaker than it should be) or "idea" (an opportunity, not a fault).
- element_ids: the ids, from the element list, of the elements the finding is about. Cite only ids that exist. A finding with no valid id is discarded.
- device: "desktop" or "mobile" — the capture the finding is seen on. Desktop ids start with "d", phone ids with "m".
- confidence: 0 to 1, how sure a senior auditor would be.

Also give takeaways: up to 4 short lines each for good (what works and should be kept), improve, fix, and ideas — and a 2–3 sentence summary of the key findings.

Report at most ${MAX_FINDINGS} findings, the most important first. Do not invent numbers, statistics or facts about the business. Answer in the JSON schema only.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page_goal: { type: 'string' },
    summary: { type: 'string' },
    takeaways: {
      type: 'object',
      additionalProperties: false,
      properties: {
        good: { type: 'array', items: { type: 'string' } },
        improve: { type: 'array', items: { type: 'string' } },
        fix: { type: 'array', items: { type: 'string' } },
        ideas: { type: 'array', items: { type: 'string' } },
      },
      required: ['good', 'improve', 'fix', 'ideas'],
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          bucket: { type: 'string', enum: ['fix', 'improve', 'idea'] },
          area: { type: 'string', enum: Object.keys(AREAS) },
          device: { type: 'string', enum: ['desktop', 'mobile'] },
          issue: { type: 'string' },
          impact: { type: 'string' },
          solution: { type: 'string' },
          element_ids: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
        required: ['title', 'bucket', 'area', 'device', 'issue', 'impact', 'solution', 'element_ids', 'confidence'],
      },
    },
  },
  required: ['page_goal', 'summary', 'takeaways', 'findings'],
};

export type ExpertReply = {
  page_goal: string;
  summary: string;
  takeaways: Takeaways;
  findings: {
    title: string;
    bucket: ExpertBucket;
    area: string;
    device: 'desktop' | 'mobile';
    issue: string;
    impact: string;
    solution: string;
    element_ids: string[];
    confidence: number;
  }[];
};

const describe = (a: Anchor) => {
  const label: Record<string, string> = {
    heading: 'Heading',
    cta: 'Button',
    link: 'Link',
    nav: 'Navigation',
    form: 'Form',
    field: 'Field',
    image: 'Image',
    section: 'Section',
    pinned: 'Pinned bar',
    text: 'Text',
  };
  return a.text ? `${label[a.kind] ?? 'Element'} “${a.text}”` : (label[a.kind] ?? 'Element');
};

const anchorLine = (a: Anchor) =>
  `${a.id} ${a.kind} y=${Math.round(a.box.y)} ${Math.round(a.box.w)}x${Math.round(a.box.h)}${a.text ? ` "${a.text}"` : ''}`;

/* ----------------------------------------------------------- validation */

export type Accepted = {
  title: string;
  note: ExpertNote;
  anchors: Anchor[];
  confidence: number;
};

const clean = (s: unknown, max: number) =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const vague = (s: string) => {
  const lower = s.toLowerCase();
  return BANNED_PHRASES.some((p) => lower.includes(p));
};

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);

/**
 * Everything the model said, checked before any of it reaches a reader. Pure,
 * so the fixtures can feed it replies that try to break the rules.
 */
export function acceptExpertReply(
  reply: ExpertReply,
  anchors: Map<string, Anchor>,
  measured: Pick<Finding, 'checkName' | 'evidence'>[],
): {
  pageGoal: string | null;
  summary: string | null;
  takeaways: Takeaways;
  accepted: Accepted[];
  rejected: string[];
} {
  const rejected: string[] = [];
  const measuredSelectors = new Set(measured.flatMap((f) => f.evidence.map((e) => e.selector)));
  const measuredWords = measured.map((f) => words(f.checkName));

  const accepted: Accepted[] = [];
  const titles = new Set<string>();

  for (const f of reply.findings ?? []) {
    const title = clean(f.title, 90);
    const issue = clean(f.issue, 420);
    const impact = clean(f.impact, 300);
    const solution = clean(f.solution, 520);
    if (!title || !issue || !impact || !solution) {
      rejected.push(`${title || 'untitled'}: a part of issue, impact or solution is missing`);
      continue;
    }
    if ([title, issue, impact, solution].some(vague)) {
      rejected.push(`${title}: vague advice`);
      continue;
    }
    const cited = (f.element_ids ?? []).map((id) => anchors.get(String(id).trim())).filter((a): a is Anchor => !!a);
    if (!cited.length) {
      rejected.push(`${title}: cites nothing on the page`);
      continue;
    }
    // One capture per finding: keep the ids from the device most of them are on.
    const desktop = cited.filter((a) => a.id.startsWith('d'));
    const mobile = cited.filter((a) => a.id.startsWith('m'));
    const device: 'desktop' | 'mobile' = mobile.length > desktop.length ? 'mobile' : 'desktop';
    const onDevice = (device === 'mobile' ? mobile : desktop).slice(0, 5);

    const confidence = Math.max(0, Math.min(1, Number(f.confidence) || 0));
    if (confidence < MIN_CONFIDENCE) {
      rejected.push(`${title}: confidence ${confidence.toFixed(2)} is below ${MIN_CONFIDENCE}`);
      continue;
    }
    const key = title.toLowerCase();
    if (titles.has(key)) {
      rejected.push(`${title}: repeats another finding`);
      continue;
    }
    // A measured finding about the same element and the same thing wins: it
    // has the measurement behind it.
    const mine = words(title + ' ' + issue);
    const sameElement = onDevice.some((a) => measuredSelectors.has(a.selector));
    const sameTopic = measuredWords.some((w) => {
      if (!w.size) return false;
      let shared = 0;
      for (const x of w) if (mine.has(x)) shared += 1;
      return shared / w.size >= 0.5;
    });
    if (sameElement && sameTopic) {
      rejected.push(`${title}: already reported by a measured check`);
      continue;
    }

    titles.add(key);
    const bucket: ExpertBucket = f.bucket === 'fix' || f.bucket === 'improve' || f.bucket === 'idea' ? f.bucket : 'improve';
    const area = f.area in AREAS ? f.area : 'Visual hierarchy';
    accepted.push({ title, confidence, anchors: onDevice, note: { issue, impact, solution, bucket, device, area } });
  }

  const order: Record<ExpertBucket, number> = { fix: 0, improve: 1, idea: 2 };
  accepted.sort((a, b) => order[a.note.bucket] - order[b.note.bucket] || b.confidence - a.confidence);
  if (accepted.length > MAX_FINDINGS) {
    for (const a of accepted.slice(MAX_FINDINGS)) rejected.push(`${a.title}: over the limit of ${MAX_FINDINGS}`);
    accepted.length = MAX_FINDINGS;
  }

  const list = (xs: unknown) =>
    (Array.isArray(xs) ? xs : [])
      .map((x) => clean(x, 180))
      .filter((x) => x && !vague(x))
      .slice(0, 4);
  const t = reply.takeaways ?? ({} as Takeaways);
  const pageGoal = clean(reply.page_goal, 240);
  const summary = clean(reply.summary, 700);

  return {
    pageGoal: pageGoal || null,
    summary: summary && !vague(summary) ? summary : null,
    takeaways: { good: list(t.good), improve: list(t.improve), fix: list(t.fix), ideas: list(t.ideas) },
    accepted,
    rejected,
  };
}

/* ------------------------------------------------------------ captures */

const TONE: Record<ExpertBucket, string> = { fix: '#C2410C', improve: '#146EF5', idea: '#6B7280' };

/**
 * The region of the page the finding is about, with each cited element boxed
 * and numbered in the bucket's colour. Drawn on the server so the report can
 * show it as it is, and so it prints.
 */
async function annotatedCrop(full: FullPage, anchors: Anchor[], bucket: ExpertBucket): Promise<string> {
  const minH = full.width < 600 ? 700 : 520;
  const maxH = full.width < 600 ? 1400 : 1300;
  const pad = 56;
  const top = Math.max(0, Math.min(...anchors.map((a) => a.box.y)) - pad);
  let bottom = Math.min(full.height, Math.max(...anchors.map((a) => a.box.y + a.box.h)) + pad);
  if (bottom - top < minH) bottom = Math.min(full.height, top + minH);
  if (bottom - top > maxH) bottom = top + maxH;
  const height = Math.max(1, Math.round(bottom - top));

  const tone = TONE[bucket];
  const marks = anchors
    .map((a, i) => {
      const x = Math.max(2, Math.round(a.box.x));
      const y = Math.round(a.box.y - top);
      const w = Math.min(full.width - x - 2, Math.round(a.box.w));
      const h = Math.round(a.box.h);
      if (y > height || y + h < 0) return '';
      const mx = Math.max(0, x - 15);
      const my = Math.max(0, y - 15);
      return `<rect x="${x}" y="${Math.max(1, y)}" width="${Math.max(6, w)}" height="${Math.max(6, Math.min(h, height - Math.max(1, y) - 1))}" rx="4" fill="none" stroke="${tone}" stroke-width="3"/>
<rect x="${mx}" y="${my}" width="30" height="30" rx="6" fill="${tone}"/>
<text x="${mx + 15}" y="${my + 21}" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">${i + 1}</text>`;
    })
    .join('\n');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${full.width}" height="${height}">${marks}</svg>`);

  const out = await sharp(full.jpeg)
    .extract({ left: 0, top: Math.round(top), width: full.width, height })
    .composite([{ input: svg, top: 0, left: 0 }])
    .resize({ width: Math.min(full.width, 1200), withoutEnlargement: true })
    .jpeg({ quality: 76 })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}

/* ----------------------------------------------------------------- run */

const NIELSEN: Record<ExpertBucket, 3 | 2 | 1> = { fix: 3, improve: 2, idea: 1 };
const LEVEL: Record<ExpertBucket, 'high' | 'medium' | 'low'> = { fix: 'high', improve: 'medium', idea: 'low' };

export type ExpertResult = {
  ran: boolean;
  error: string | null;
  pageGoal: string | null;
  summary: string | null;
  takeaways: Takeaways | null;
  findings: Finding[];
  rejected: string[];
};

const none = (error: string | null): ExpertResult => ({
  ran: false,
  error,
  pageGoal: null,
  summary: null,
  takeaways: null,
  findings: [],
  rejected: [],
});

export async function expertReview(input: {
  measured: Measured | null;
  url: string;
  pageType: PageTypeResult;
  goal: { name: string; blurb: string };
  findings: Finding[];
}): Promise<ExpertResult> {
  if (!modelAvailable()) return none('No model key is configured, so the expert review did not run.');
  const desktop = input.measured?.page.ok ? input.measured.page.value : null;
  if (!desktop) return none('The full page could not be captured, so the expert review did not run.');
  const mobile = input.measured?.mobile.ok ? input.measured.mobile.value.full : null;

  // The capture, cut into tiles the model can read at full resolution.
  const tiles: { label: string; data: string }[] = [];
  for (let y = 0; y < desktop.height && tiles.length < MAX_TILES; y += TILE_HEIGHT) {
    const h = Math.min(TILE_HEIGHT, desktop.height - y);
    const buf = await sharp(desktop.jpeg).extract({ left: 0, top: y, width: desktop.width, height: h }).jpeg({ quality: 72 }).toBuffer();
    tiles.push({ label: `Desktop capture, 1440px wide, page y ${y}–${y + h}`, data: buf.toString('base64') });
  }
  if (mobile) {
    tiles.push({ label: 'Phone capture, 390px wide, the first two screens', data: (await sharp(mobile.jpeg).jpeg({ quality: 72 }).toBuffer()).toString('base64') });
  }

  const brief = [
    `Page: ${input.url}`,
    `Page type (measured): ${input.pageType.type.replace(/_/g, ' ')}`,
    `The client's goal for this audit: ${input.goal.name} — ${input.goal.blurb}`,
    '',
    'Elements on the desktop page (id kind y size "text"):',
    ...desktop.anchors.map(anchorLine),
    ...(mobile ? ['', 'Elements on the phone page:', ...mobile.anchors.map(anchorLine)] : []),
    '',
    'Already reported by the measured checks — do not repeat these:',
    ...(input.findings.length ? input.findings.map((f) => `- ${f.checkName}`) : ['- (none)']),
  ].join('\n');

  const content: Anthropic.Beta.Messages.BetaContentBlockParam[] = [{ type: 'text', text: brief }];
  for (const tile of tiles) {
    content.push({ type: 'text', text: tile.label });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: tile.data } });
  }
  content.push({ type: 'text', text: 'Review this page as described. Answer in the JSON schema only.' });

  let reply: ExpertReply;
  try {
    reply = await ask<ExpertReply>(SYSTEM, content, SCHEMA, 'medium', 12000);
  } catch (err) {
    return none(`The expert review did not complete: ${describeModelError(err)}.`);
  }

  const byId = new Map<string, Anchor>([...desktop.anchors, ...(mobile?.anchors ?? [])].map((a) => [a.id, a]));
  const checked = acceptExpertReply(reply, byId, input.findings);

  const findings: Finding[] = [];
  for (const [i, a] of checked.accepted.entries()) {
    const full = a.note.device === 'mobile' && mobile ? mobile : desktop;
    let capture: string | null = null;
    try {
      capture = await annotatedCrop(full, a.anchors, a.note.bucket);
    } catch {
      capture = null;
    }
    const id = `EX-${String(i + 1).padStart(2, '0')}`;
    findings.push({
      id,
      ruleId: 'EXPERT',
      checkName: a.title,
      criterionId: id,
      criterionName: 'Expert review',
      passCondition: '',
      standard: `Expert review · ${a.note.area}`,
      pillar: AREAS[a.note.area] ?? 'hierarchy',
      family: 'EXPERT',
      familyName: 'Expert review',
      name: a.title,
      layer: 'L3',
      severity: LEVEL[a.note.bucket],
      nielsen: NIELSEN[a.note.bucket],
      confidence: Math.round(a.confidence * 100) / 100,
      confidenceFloor: MIN_CONFIDENCE,
      effort: 'medium',
      rootCauseId: `expert:${id}`,
      status: 'confirmed',
      reviewReason: null,
      evidence: a.anchors.map((an, j) => ({
        evidenceId: `${id}-${j + 1}`,
        selector: an.selector,
        screenshotRef: a.note.device,
        bbox: [an.box.x, an.box.y, an.box.w, an.box.h],
        observed: describe(an),
        expected: '',
        // Page coordinates, not first-screen ones: the annotated crop carries
        // the marks, so the report does not draw its own.
        documentLevel: true,
        fields: (j === 0 && capture ? { expert_capture: capture } : {}) as Record<string, string>,
      })),
      rationale: a.note.impact,
      fix: a.note.solution,
      deduction: 0,
      severityNote: null,
      annotations: [],
      source: 'expert',
      expert: a.note,
    });
  }

  return {
    ran: true,
    error: null,
    pageGoal: checked.pageGoal,
    summary: checked.summary,
    takeaways: checked.takeaways,
    findings,
    rejected: checked.rejected,
  };
}
