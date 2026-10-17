import { SEVERITY_NAME, VERDICT_LABEL } from '@/lib/audit/framework';
import type { AuditResult } from '@/lib/audit/types';

/**
 * The report as Markdown, for taking away: it opens in anything, pastes into a
 * ticket, and keeps the criterion ids so a fix can be checked back against the
 * audit. Evidence keeps its selectors and its measured values, because a finding
 * without them is an opinion.
 */
export function reportMarkdown(result: AuditResult): string {
  const when = new Date(result.fetchedAt).toLocaleString();
  const out: string[] = [];

  out.push(`# UX audit — ${hostOf(result.finalUrl)}`);
  out.push('');
  out.push(`${result.finalUrl}  `);
  out.push(`${when} · goal: ${result.goal.name} · ${result.pageType.type.replace(/_/g, ' ')} page · ${result.platforms.join(' + ')}`);
  out.push('');
  out.push(
    result.overall == null
      ? '**Not scored.** Too little could be measured on this page for a score to mean anything.'
      : `## Overall: ${result.overall}/100 — ${result.band}`,
  );
  out.push('');
  out.push(result.scoreBasis);
  if (result.summary) {
    out.push('');
    out.push(result.summary);
  }

  out.push('');
  out.push('## Pillars');
  out.push('');
  out.push('| Pillar | Score | Band | Pass | Partial | Fail | For a reviewer | Weight |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const p of result.pillars) {
    out.push(
      `| ${p.name} | ${p.score ?? '—'} | ${p.band ?? '—'} | ${p.counts.pass} | ${p.counts.partial} | ${p.counts.fail} | ${p.counts.not_assessed} | ×${p.weight} |`,
    );
  }

  if (result.priorities.length) {
    out.push('');
    out.push('## Fix these first');
    out.push('');
    out.push('Ranked by severity, by how many places each appears, and by the weight the goal puts on its pillar.');
    out.push('');
    result.priorities.forEach((p, i) => {
      out.push(`${i + 1}. **${p.problem}** (${p.criterionId} ${p.criterionName}, ${SEVERITY_NAME[p.severity]}, ${p.instances} ${p.instances === 1 ? 'place' : 'places'}, ${p.effort} fix)`);
      out.push(`   - Found: ${p.observed}`);
      out.push(`   - Fix: ${oneLine(p.fix)}`);
    });
  }

  out.push('');
  out.push('## Findings');
  for (const pillar of result.pillars) {
    const own = result.findings.filter((f) => f.pillar === pillar.id);
    if (!own.length) continue;
    out.push('');
    out.push(`### ${pillar.name}`);
    for (const f of own) {
      out.push('');
      out.push(`#### ${f.checkName}`);
      out.push('');
      out.push(`${f.criterionId} — ${f.criterionName}`);
      out.push('');
      out.push(`- Severity: ${SEVERITY_NAME[f.nielsen]} (${f.nielsen}/4) · ${f.evidence.length} ${f.evidence.length === 1 ? 'instance' : 'instances'} · ${f.effort} fix`);
      out.push(`- Standard: ${f.standard}`);
      out.push(`- Required: ${f.passCondition}`);
      out.push(`- Why it matters: ${f.rationale}`);
      out.push(`- Fix: ${oneLine(f.fix)}`);
      out.push('');
      out.push('  Evidence:');
      for (const e of f.evidence.slice(0, 8)) {
        out.push(`  - \`${e.selector}\` — ${e.observed} (expected ${e.expected})`);
      }
    }
  }

  if (result.review.length) {
    out.push('');
    out.push('## Measured, not certain');
    out.push('');
    out.push('Each of these was measured but is not certain enough to report as a failure. They change no score.');
    out.push('');
    for (const f of result.review) {
      out.push(`- **${f.checkName}** (${f.criterionId}) — ${f.evidence[0]?.observed} (${Math.round(f.confidence * 100)}% confidence). ${f.reviewReason ?? ''}`);
    }
  }

  if (result.reviewerTasks.length) {
    out.push('');
    out.push('## Needs a person');
    out.push('');
    out.push('These cannot be settled from one page load. They are outside the score on both sides.');
    out.push('');
    for (const t of result.reviewerTasks) {
      out.push(`- **${t.criterionId} ${t.criterion}** (${t.pillarName}, up to ${SEVERITY_NAME[t.severityIfFailed]}) — ${t.task}`);
    }
  }

  if (result.whatWorks.length) {
    out.push('');
    out.push('## What this page gets right');
    out.push('');
    for (const w of result.whatWorks) {
      out.push(`- **${w.criterionId} ${w.criterion}** — ${w.text}`);
    }
  }

  out.push('');
  out.push('## Every criterion');
  out.push('');
  out.push('| ID | Criterion | Verdict | How it was judged | Note |');
  out.push('| --- | --- | --- | --- | --- |');
  for (const c of result.criteria) {
    out.push(`| ${c.id} | ${c.name} | ${VERDICT_LABEL[c.verdict]} | ${c.method} | ${cell(c.note)} |`);
  }

  out.push('');
  out.push('---');
  out.push('');
  out.push(
    `Measured in Chromium at 1440×900 and again at 320px. ${result.coverage.assessed} of ${result.coverage.total} criteria in scope were judged; the rest need a reviewer. ${result.provenance}.`,
  );

  return out.join('\n');
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, ' ').trim();
const cell = (s: string) => oneLine(s).replace(/\|/g, '\\|').slice(0, 160);

/** The opening of an email asking for these fixes, with the worst of them listed. */
export function fixRequestBody(result: AuditResult): string {
  const lines = [
    `I ran a UX audit of ${result.finalUrl} with Zaudit.`,
    result.overall == null ? '' : `It scored ${result.overall}/100 (${result.band}) against the ${result.goal.name.toLowerCase()} goal.`,
    '',
    'The findings I would like fixed first:',
    ...result.priorities.map((p, i) => `${i + 1}. ${p.criterionName} (${p.criterionId}, ${SEVERITY_NAME[p.severity]}) — ${p.observed}`),
    '',
    `Report: ${typeof window === 'undefined' ? '' : window.location.href}`,
    '',
    'What would it take to get these fixed?',
  ];
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
