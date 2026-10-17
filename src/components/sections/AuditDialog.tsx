'use client';

import {
  Badge,
  Button,
  CountPill,
  Divider,
  IconBox,
  Meter,
  Modal,
  Row,
  Spacer,
  Stack,
  Text,
  type IconName,
} from '@/components/ui';
import { RotatingLines, ShimmerText } from '@/components/ui/ShimmerText';
import { SEVERITY_DOTS, SEVERITY_SCALE } from '@/components/ui/SeverityTag';
import { color, mix, radius, t } from '@/design/tokens';
import { AUDIT_STAGE_LINES } from '@/content/homepage';
import { useRouter } from 'next/navigation';
import { GOALS, SEVERITY_NAME, type GoalId } from '@/lib/audit/framework';
import { STAGES, type AuditState } from '@/hooks/useAudit';

/**
 * How far along the bar sits.
 *
 * The stage boundaries are real: they only move when the engine sends a stage
 * event. Inside a stage the bar eases toward the next boundary without ever
 * arriving, so the movement says "still working" without claiming progress the
 * engine has not reported. It never shows 100 until a result actually lands.
 */
function progressFor(stageIndex: number, secondsInStage: number): number {
  const span = 100 / STAGES.length;
  const settled = stageIndex * span;
  // 1 - e^-x: quick at first, then flattening, so a slow stage keeps creeping
  // but never overtakes the next boundary.
  const creep = 1 - Math.exp(-secondsInStage / 7);
  return Math.min(99, settled + span * creep * 0.85);
}

export function AuditDialog({
  state,
  start,
  setGoal,
  close,
}: {
  state: AuditState;
  start: () => void;
  setGoal: (goal: GoalId) => void;
  close: () => void;
}) {
  const router = useRouter();
  const { stage, url, goal, stageIndex, elapsed, stageStartedAt, result, error, quota, dialogOpen } =
    state;

  let host = '';
  try {
    host = url ? new URL(/^https?:/i.test(url) ? url : 'https://' + url).hostname : '';
  } catch {
    host = url;
  }

  const secondsInStage = stageStartedAt ? Math.max(0, (Date.now() - stageStartedAt) / 1000) : 0;
  const pct = stage === 'done' ? 100 : progressFor(stageIndex, secondsInStage);

  const title =
    stage === 'goal'
      ? 'Before we start'
      : stage === 'done'
      ? 'Audit complete'
      : stage === 'error'
        ? 'The audit could not complete'
        : `Auditing ${host || 'your page'}`;

  return (
    <Modal
      open={dialogOpen}
      onClose={close}
      title={title}
      // While it is running, a stray click on the backdrop would throw the run
      // away. Escape and the explicit Cancel still work.
      dismissOnBackdrop={stage !== 'running'}
      width={stage === 'done' ? 560 : 520}
    >
      <Stack gap={0} style={{ padding: 28 }}>
        {/* ---------------------------------------------------------- goal */}
        {stage === 'goal' && (
          <Stack gap={18}>
            <Stack gap={6}>
              <Text variant="labelLg">What is this audit for?</Text>
              <Text variant="bodySm" tone="muted" wrap="pretty">
                Every criterion runs either way. The goal decides what carries more weight in the score, and
                whether the optional pillars — trust and privacy, conversion — switch on.
              </Text>
            </Stack>

            <Stack gap={6} role="radiogroup" aria-label="Audit goal">
              {GOALS.map((g) => {
                const picked = g.id === goal;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => setGoal(g.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: radius.md,
                      cursor: 'pointer',
                      background: picked ? mix(color.primary, 8) : 'transparent',
                      border: `1px solid ${picked ? color.primary : color.border}`,
                      color: 'inherit',
                    }}
                  >
                    <Row gap={10} align="start">
                      <span style={{ display: 'inline-flex', paddingTop: 1, color: picked ? color.primary : color.mutedFg }}>
                        <IconBox name={picked ? 'IconCircleCheck' : 'IconCircle'} size="w-4" />
                      </span>
                      <Stack gap={2}>
                        <Text variant="labelStrong">{g.name}</Text>
                        <Text variant="fine" tone="muted" wrap="pretty">
                          {g.blurb}
                        </Text>
                      </Stack>
                    </Row>
                  </button>
                );
              })}
            </Stack>

            <Row gap={8}>
              <Button variant="primary" iconEnd="IconArrowUpRight" onClick={start}>
                Run the audit
              </Button>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Spacer />
              <Text variant="fine" tone="muted">
                {host}
              </Text>
            </Row>
          </Stack>
        )}

        {/* ------------------------------------------------------- running */}
        {stage === 'running' && (
          <Stack gap={20}>
            <Row justify="between" gap={12} align="start">
              <Stack gap={4}>
                <ShimmerText font={t(600, 16, 22)}>{STAGES[stageIndex]}</ShimmerText>
                <Text variant="mono" tone="muted">
                  {host || 'your page'}
                </Text>
              </Stack>
              <Text variant="mono" tone="muted" style={{ paddingTop: 4 }}>
                {elapsed}s
              </Text>
            </Row>

            <Stack gap={10}>
              <Meter
                value={pct}
                smooth
                label={`Audit progress: stage ${stageIndex + 1} of ${STAGES.length}`}
              />
              <RotatingLines
                lines={AUDIT_STAGE_LINES[stageIndex] ?? []}
                resetKey={stageIndex}
              />
            </Stack>

            <Divider />

            {/* the four real stages, so the rotating copy always has context */}
            <Stack gap={2}>
              {STAGES.map((label, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                const icon: IconName = done
                  ? 'IconCircleCheck'
                  : active
                    ? 'IconLoaderCircle'
                    : 'IconCircle';
                return (
                  <Row key={label} gap={10} style={{ padding: '5px 0' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 16,
                        height: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: done ? color.primary : color.mutedFg,
                        animation: active ? 'hp-spin 700ms linear infinite' : 'none',
                      }}
                    >
                      <IconBox name={icon} size="w-4" />
                    </span>
                    <Text
                      variant="label"
                      colorValue={done || active ? color.fg : color.mutedFg}
                      style={active ? { animation: 'hp-pulse 1.8s ease-in-out infinite' } : undefined}
                    >
                      {label}
                    </Text>
                  </Row>
                );
              })}
            </Stack>

            <Row gap={12}>
              <Text variant="fine" tone="muted">
                Reading a real page takes 20–40 seconds.
              </Text>
              <Spacer />
              <Button variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
            </Row>
          </Stack>
        )}

        {/* --------------------------------------------------------- error */}
        {stage === 'error' && (
          <Stack gap={20}>
            <Row gap={12} align="start">
              <span
                style={{
                  display: 'inline-flex',
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color.destructive,
                  background: mix(color.destructive, 12),
                }}
              >
                <IconBox name="IconTriangleAlert" size="w-4" />
              </span>
              <Stack gap={6}>
                <Text variant="labelLg">The audit could not complete.</Text>
                <Text variant="bodySm" tone="muted" wrap="pretty">
                  {error}
                </Text>
              </Stack>
            </Row>

            {quota && (
              <Text
                variant="fine"
                tone="muted"
                wrap="pretty"
                style={{
                  padding: '12px 14px',
                  background: color.muted,
                  borderRadius: radius.sm,
                }}
              >
                The PageSpeed Insights quota for this deployment’s key is exhausted. The audit can
                still run from the live page read.
              </Text>
            )}

            <Row gap={8}>
              <Button variant="primary" onClick={start}>
                Try again
              </Button>
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </Row>
          </Stack>
        )}

        {/* ---------------------------------------------------------- done */}
        {stage === 'done' && result && (
          <Stack gap={20}>
            <Row justify="between" align="start" gap={16}>
              <Stack gap={4}>
                <Text variant="labelLg">Audit complete</Text>
                <Text variant="mono" tone="muted">
                  {result.finalUrl}
                </Text>
              </Stack>
              <Badge variant="secondary">{result.band ?? 'Not scored'}</Badge>
            </Row>

            <Stack gap={10}>
              <Row align="baseline" gap={8}>
                <Text variant="metricLg" style={{ letterSpacing: -1 }}>
                  {result.overall ?? '—'}
                </Text>
                <Text tone="muted" style={{ fontSize: 17 }}>
                  / 100
                </Text>
                <Spacer />
                <Text variant="caption" tone="muted">
                  in {elapsed}s
                </Text>
              </Row>
              <Meter value={result.overall ?? 0} smooth label={`Overall score: ${result.overall ?? 0} of 100`} />
              <Text variant="fine" tone="muted">
                {result.coverage.assessed} of {result.coverage.total} criteria judged · weighted for “{result.goal.name}”
              </Text>
            </Stack>

            <Stack gap={10}>
              <Text variant="labelStrong">
                {result.findings.length} finding{result.findings.length === 1 ? '' : 's'} across{' '}
                {new Set(result.findings.map((f) => f.pillar)).size} pillar
                {new Set(result.findings.map((f) => f.pillar)).size === 1 ? '' : 's'}
              </Text>
              <Row gap={6} wrap>
                {([4, 3, 2, 1] as const).map((n) => (
                  <CountPill key={n} dot={SEVERITY_DOTS[SEVERITY_SCALE[n]]}>
                    {result.counts[n]} {SEVERITY_NAME[n]}
                  </CountPill>
                ))}
              </Row>
            </Stack>

            {result.reviewerTasks.length > 0 && (
              <Text variant="fine" tone="muted" wrap="pretty">
                {result.reviewerTasks.length} criteria need a person to work the product — they are listed in the report as
                tasks rather than counted in the score.
              </Text>
            )}

            <Divider />

            <Row gap={8}>
              {result.findings.length > 0 && (
                <Button
                  variant="primary"
                  iconEnd="IconArrowUpRight"
                  onClick={() => {
                    close();
                    // The findings live on their own page, where they can be
                    // printed, exported and sent on.
                    router.push(`/report/${result.id}`);
                  }}
                >
                  Open the report
                </Button>
              )}
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </Row>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
