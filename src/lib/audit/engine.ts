import { createHash } from 'node:crypto';
import { annotate, overview } from './annotate';
import { axeVersion, gotoLoader, measurePage, type Measured } from './browser';
import { CRITERIA, PILLARS, criterion as criterionOf, pillar as pillarOf } from './catalog';
import { classifyBySignals } from './classify';
import { VIEWPORT, type ContractFinding, type PageTypeResult } from './contract';
import { docFacts, parseHtml, type DocFacts } from './document';
import { evaluate, holdAssisted, type Evaluation } from './evaluate';
import { FetchError, fetchPage, type PageFetch } from './fetch';
import { DEFAULT_GOAL, GOALS, weightsFor, type GoalId, type Platform, type Severity, type Verdict } from './framework';
import { UnsafeUrlError, assertPublicUrl } from './net';
import { classifyWithModel, describeModelError, modelAvailable, reviewFindings } from './review';
import { expertReview } from './expert';
import { score } from './score';
import type { AuditResult, Finding, ReviewerTask, WorkingItem } from './types';

export class AuditError extends Error {
  quota: boolean;
  /** What would fix this, when something would: sign in, or buy credits. */
  action?: 'signin' | 'buy';
  constructor(message: string, quota = false, action?: 'signin' | 'buy') {
    super(message);
    this.name = 'AuditError';
    this.quota = quota;
    this.action = action;
  }
}

/**
 * One audit, in the framework's order:
 *
 *   0. The page is opened in a real browser at 1440×900 and measured, with the
 *      served HTML fetched alongside for its status.
 *   1. The page type and the platforms in scope are decided, before any
 *      criterion is judged.
 *   2. Every check runs, and the measurements roll up into criterion verdicts:
 *      pass, partial, fail, not applicable, not assessed.
 *   3. The model reviews what it is allowed to: false positives, severity,
 *      confidence, the prose. It cannot create a finding.
 *   4. Pillars are scored as weighted pass rates, and the overall score applies
 *      the goal's weights.
 *
 * Nothing that did not run is ever reported as a pass.
 */
export async function audit(
  rawUrl: string,
  { goal: goalId = DEFAULT_GOAL, onStage, signal, id: givenId }: { goal?: GoalId; onStage?: (index: number) => void; signal?: AbortSignal; /** The caller's own id for this run, when it has already named it. */ id?: string } = {},
): Promise<AuditResult> {
  const startedAt = Date.now();
  const goal = GOALS.find((g) => g.id === goalId) ?? GOALS.find((g) => g.id === DEFAULT_GOAL)!;
  const stage = (i: number) => onStage?.(i);
  const cancelled = () => {
    if (signal?.aborted) throw new AuditError('The audit was cancelled.');
  };

  /* 0 — measure ------------------------------------------------------- */
  stage(0);
  let url: URL;
  try {
    url = await assertPublicUrl(rawUrl);
  } catch (err) {
    if (err instanceof UnsafeUrlError) throw new AuditError(err.message);
    throw err;
  }

  const wantBrowser = process.env.ZAUDIT_CAPTURE !== 'off';
  const [fetchedSettled, measuredSettled] = await Promise.all([
    fetchPage(url.href).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
    wantBrowser
      ? measurePage(gotoLoader(url.href), { signal }).then(
          (value) => ({ ok: true as const, value }),
          (error: unknown) => ({ ok: false as const, error }),
        )
      : Promise.resolve({ ok: true as const, value: null }),
  ]);
  cancelled();

  const fetched: PageFetch | null = fetchedSettled.ok ? fetchedSettled.value : null;
  const measured: Measured | null = measuredSettled.ok ? measuredSettled.value : null;

  const noBrowser = measured
    ? null
    : !wantBrowser
      ? 'Browser measurement is switched off for this deployment (ZAUDIT_CAPTURE=off), so nothing that depends on layout, colour or keyboard focus was measured.'
      : !measuredSettled.ok
        ? `The page could not be opened in a browser (${reason(measuredSettled.error)}), so nothing that depends on layout, colour or keyboard focus was measured.`
        : 'No browser could be launched on the server, so nothing that depends on layout, colour or keyboard focus was measured.';

  if (!measured && !fetched) {
    const why =
      !fetchedSettled.ok && fetchedSettled.error instanceof FetchError
        ? fetchedSettled.error.message
        : `Could not read ${url.href}. The site may block automated readers, or be unreachable.`;
    throw new AuditError(why + ' Check the address and try again.');
  }

  const refused = [measured?.status, fetched?.status].find((s) => s === 401 || s === 403 || s === 429 || s === 503);
  if (refused && (measured?.status ?? fetched?.status) === refused) {
    throw new AuditError(
      `${url.host} refused the audit (HTTP ${refused}) — usually bot protection or rate limiting. Nothing was audited, so there is no score. Try again later, or audit a page the site serves publicly.`,
    );
  }

  /* 1 — classify ------------------------------------------------------ */
  stage(1);
  const source = measured
    ? { html: measured.html, url: measured.finalUrl, status: measured.status ?? fetched?.status ?? null }
    : { html: fetched!.html, url: fetched!.finalUrl, status: fetched!.status };
  const docNode = parseHtml(source.html, source.url);
  const doc: DocFacts | null = docNode ? docFacts(docNode, source.url, source.status) : null;

  let pageType: PageTypeResult = doc
    ? classifyBySignals(doc)
    : { type: 'unknown', confidence: 0, source: 'none', signals: ['the page’s HTML could not be parsed'] };

  const model = { available: modelAvailable(), classified: false, reviewed: false, error: null as string | null, rejected: [] as string[] };
  if (model.available && doc) {
    try {
      const byModel = await classifyWithModel(doc, pageType);
      if (byModel) {
        pageType = byModel;
        model.classified = true;
      }
    } catch (err) {
      model.error = `page classification: ${describeModelError(err)}`;
    }
  }
  // An application screen is held to the web-app criteria as well as the web ones.
  const platforms: Platform[] = ['dashboard', 'settings', 'onboarding'].includes(pageType.type) ? ['web', 'webapp'] : ['web'];
  cancelled();

  /* 2 — evaluate ------------------------------------------------------ */
  stage(2);
  let evaluation: Evaluation = evaluate({ measured, noBrowser, doc, pageType, platforms });
  // The optional pillars are switches: with the goal's toggles off, their
  // criteria are out of scope entirely rather than failures nobody asked about.
  const inScope = new Set(Object.keys(weightsFor(goal, PILLARS)));
  evaluation = {
    ...evaluation,
    criteria: evaluation.criteria.filter((c) => inScope.has(c.pillar)),
    findings: evaluation.findings.filter((f) => inScope.has(f.pillar)),
  };

  /* 3 — review -------------------------------------------------------- */
  stage(3);
  let summary: string | null = null;
  if (model.available && evaluation.findings.length + evaluation.passes.length > 0) {
    try {
      const reviewed = await reviewFindings(source.url, pageType, evaluation, evaluation.findings);
      evaluation = { ...evaluation, findings: reviewed.findings };
      summary = reviewed.summary;
      model.reviewed = true;
      model.rejected = reviewed.rejected;
    } catch (err) {
      const msg = `review: ${describeModelError(err)}`;
      model.error = model.error ? `${model.error}; ${msg}` : msg;
    }
  }
  evaluation = holdAssisted(evaluation, model.reviewed);
  cancelled();

  // The auditor's read. Outside the score by design: the score stays a measure
  // of what was measured, and the expert findings are shown beside it, labelled.
  cancelled();
  const expert = await expertReview({
    measured,
    url: source.url,
    pageType,
    goal: { name: goal.name, blurb: goal.blurb },
    findings: evaluation.findings.filter((f) => f.status === 'confirmed').map((f) => ({ ...f, annotations: [] })),
  });

  /* 4 — score --------------------------------------------------------- */
  stage(4);
  const scored = score(evaluation.criteria, evaluation.findings, goal);
  const order = (f: ContractFinding) => -f.nielsen * 100 - Math.min(f.evidence.length, 10);
  const confirmed = evaluation.findings.filter((f) => f.status === 'confirmed').sort((a, b) => order(a) - order(b));
  const review = evaluation.findings.filter((f) => f.status === 'needs_human_review').sort((a, b) => order(a) - order(b));

  let annotated: Finding[] = [...confirmed, ...review].map((f) => ({ ...f, annotations: [] }));
  let pins: AuditResult['annotations'] = [];
  let captureNote: string | null = null;
  if (measured) {
    try {
      const drawn = await annotate(measured.screenshot, annotated);
      annotated = drawn.findings;
      pins = drawn.pins;
    } catch (err) {
      captureNote = 'The first screen was captured but could not be cropped — ' + reason(err);
    }
  } else {
    captureNote = noBrowser;
  }

  const counts: Record<Severity, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const f of confirmed) counts[f.nielsen] += 1;

  const verdicts: Record<Verdict, number> = { pass: 0, partial: 0, fail: 0, not_applicable: 0, not_assessed: 0 };
  for (const c of evaluation.criteria) verdicts[c.verdict] += 1;

  const scopedPillars = new Set(scored.pillars.map((p) => p.id));
  const reviewerTasks: ReviewerTask[] = evaluation.criteria
    .filter((c) => c.verdict === "not_assessed" && c.reviewerTask && scopedPillars.has(c.pillar))
    .map((c) => {
      const def = criterionOf(c.id);
      return {
        criterionId: c.id,
        criterion: c.name,
        pillar: c.pillar,
        pillarName: pillarOf(c.pillar).name,
        task: c.reviewerTask!,
        why: def.why,
        severityIfFailed: def.severityBase,
      };
    });

  const whatWorks: WorkingItem[] = evaluation.passes
    .filter((p) => scopedPillars.has(criterionOf(p.criterionId).pillar))
    .sort((a, b) => b.checked - a.checked)
    .filter((p, i, all) => all.findIndex((x) => x.criterionId === p.criterionId) === i)
    .slice(0, 8)
    .map((p) => ({
      criterionId: p.criterionId,
      criterion: criterionOf(p.criterionId).name,
      pillar: criterionOf(p.criterionId).pillar,
      pillarName: pillarOf(criterionOf(p.criterionId).pillar).name,
      evidenceId: p.evidence.evidenceId,
      text: p.note,
    }));


  /**
   * A pass rate over a handful of criteria is not a score of the page — it is a
   * score of whatever happened to be measurable. Below a quarter of the criteria
   * in scope, the report says so instead of printing a number.
   */
  const thin = scored.coverage.assessed < Math.max(10, scored.coverage.total * 0.25);

  const scoreBasis = [
    thin
      ? `Too little could be measured to score this page: ${scored.coverage.assessed} of ${scored.coverage.total} criteria in scope were judged.${noBrowser ? ` ${noBrowser}` : ''}`
      : '',
    `Scored against ${scored.coverage.total} criteria in scope for a ${pageType.type === 'unknown' ? 'page of undetermined type' : `${pageType.type} page`}, under the "${goal.name}" goal.`,
    `${scored.coverage.assessed} of them could be judged from this audit; the rest need a reviewer and are listed as tasks rather than counted either way.`,
    goal.heavier.length ? `${goal.heavier.map((h) => pillarOf(h).name).join(', ')} carry double weight for this goal.` : 'Every pillar carries equal weight.',
    `Each pillar scores the share of its judged criteria that passed, with a partial counting half.`,
  ]
    .filter(Boolean)
    .join(' ');

  const provenance = [
    measured ? `Chromium at ${VIEWPORT.width}×${VIEWPORT.height}, and again at 320px` : 'No browser',
    measured?.axe.ok ? `axe-core ${axeVersion()}` : null,
    `page type: ${pageType.type} (${pageType.source === 'llm' ? 'model' : pageType.source === 'signals' ? 'page signals' : 'undetermined'})`,
    model.reviewed ? 'reviewed by the model' : model.available ? 'model review failed' : 'no model review',
    expert.ran ? `expert review: ${expert.findings.length} finding${expert.findings.length === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const fetchNote = fetched
    ? null
    : `The served HTML could not be fetched directly${!fetchedSettled.ok ? ` (${reason(fetchedSettled.error)})` : ''}; the browser copy was used.`;

  const id = givenId ?? createHash('sha1').update(`${source.url}|${goal.id}|${startedAt}`).digest('hex').slice(0, 10);

  return {
    id,
    url: url.href,
    finalUrl: source.url,
    fetchedAt: new Date().toISOString(),
    tookMs: Date.now() - startedAt,
    goal: { id: goal.id, name: goal.name, blurb: goal.blurb, heavier: goal.heavier.map((h) => pillarOf(h).name), toggles: goal.toggles.map((t) => pillarOf(t).name) },
    platforms,
    pageType,
    overall: thin ? null : scored.overall,
    band: thin ? null : scored.band,
    scoreBasis,
    pageGoal: expert.pageGoal,
    expert: { ran: expert.ran, error: expert.error, summary: expert.summary, takeaways: expert.takeaways },
    pillars: scored.pillars,
    priorities: scored.priorities,
    findings: [...annotated.filter((f) => f.status === 'confirmed').map((f) => ({ ...f, source: 'measured' as const })), ...expert.findings],
    review: annotated.filter((f) => f.status === 'needs_human_review'),
    counts,
    criteria: evaluation.criteria,
    reviewerTasks,
    whatWorks,
    coverage: { ...scored.coverage, verdicts } as AuditResult['coverage'],
    discarded: evaluation.discarded.length,
    screenshot: measured ? await overview(measured.screenshot) : null,
    annotations: pins,
    summary,
    model,
    provenance,
    fetchNote,
    captureNote,
  };
}

/** Criteria in the catalog, for the interface to show what an audit covers. */
export const CRITERIA_COUNT = CRITERIA.length;

function reason(err: unknown): string {
  return err instanceof Error ? err.message.split('\n')[0].slice(0, 160) : String(err);
}
