'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { Logo } from '@/components/site/Logo';
import { AUDIT_STAGE_LINES } from '@/content/homepage';
import { GOALS, type GoalId } from '@/lib/audit/framework';
import { STAGES, type AuditState } from '@/hooks/useAudit';
import { color, radius, t, text, tracking } from '@/design/tokens';

/**
 * The audit dialog, from `Dialog-Goal.dc.html` and `Dialog-Running.dc.html`.
 *
 * Step 1 asks what the audit is for, as a 2-column grid of six goal tiles with
 * one "Focus" line under it. Step 2 is the run: the current stage as the
 * heading, a big percentage, a solid bar, and the five stages as a bordered
 * list. When the run lands the score appears in a strip and the one action is
 * to view the report. In the design the run is a timer; here every number on
 * it is the engine's.
 */

/** The one-line focus each goal gets under the grid, from the design. */
const FOCUS: Record<GoalId, string> = {
  accessible: 'Accessibility, content and clear system states.',
  conversion: 'Usability, content, visual hierarchy and speed.',
  redesign: 'Visual hierarchy, consistency and content.',
  support: 'Usability, navigation and clear system states.',
  prelaunch: 'States, consistency, accessibility and speed.',
  health: 'Equal weight on every area. A good default.',
};

/**
 * How far along the bar sits. Stage boundaries only move on a real stage event;
 * inside a stage the bar eases toward the next boundary without arriving, so it
 * says "still working" without claiming progress the engine has not reported.
 */
function progressFor(stageIndex: number, secondsInStage: number): number {
  const span = 100 / STAGES.length;
  const creep = 1 - Math.exp(-secondsInStage / 7);
  return Math.min(99, stageIndex * span + span * creep * 0.85);
}

const eyebrow = { font: text.eyebrow, letterSpacing: tracking.eyebrow, textTransform: 'uppercase' as const, color: color.accentFg };
const heading = { margin: 0, font: t(800, 26, 1.15), letterSpacing: tracking.tight, color: color.ink };
const plainAction = {
  background: 'transparent',
  border: 'none',
  font: t(600, 14, 20),
  color: color.inkMuted,
  padding: '14px 16px',
  borderRadius: radius.button,
  cursor: 'pointer',
};
const primaryWide = {
  flex: '1 1 auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: color.action,
  color: color.onAction,
  border: 'none',
  font: text.button,
  letterSpacing: tracking.button,
  textTransform: 'uppercase' as const,
  padding: '16px 24px',
  borderRadius: radius.button,
  cursor: 'pointer',
};

function Tick() {
  return (
    <span aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0, borderRadius: radius.sm, background: color.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  );
}

export function AuditDialog({
  state,
  start,
  setGoal,
  close,
}: {
  state: AuditState;
  start: () => void;
  setGoal: (g: GoalId) => void;
  close: () => void;
}) {
  const router = useRouter();
  const { stage, url, goal, stageIndex, elapsed, stageStartedAt, result, error, action, credits, refunded, dialogOpen } = state;

  let host = '';
  try {
    host = url ? new URL(/^https?:/i.test(url) ? url : 'https://' + url).hostname.replace(/^www\./, '') : '';
  } catch {
    host = url;
  }

  const secondsInStage = stageStartedAt ? Math.max(0, (Date.now() - stageStartedAt) / 1000) : 0;
  const pct = stage === 'done' ? 100 : Math.round(progressFor(stageIndex, secondsInStage));
  const line = AUDIT_STAGE_LINES[stageIndex]?.[0] ?? '';

  const title =
    stage === 'goal' ? 'Pick a goal for your audit' : stage === 'done' ? 'Audit complete' : stage === 'error' ? 'The audit could not complete' : `Auditing ${host}`;

  return (
    <Modal open={dialogOpen} onClose={close} title={title} dismissOnBackdrop={stage !== 'running'} width={540}>
      {/* header: the logo and a square close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 16px 16px 28px', borderBottom: `1px solid ${color.border}` }}>
        <Logo height={16} />
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, color: color.inkSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: stage === 'goal' ? 20 : 22 }}>
        {/* ------------------------------------------------- step 1: goal */}
        {stage === 'goal' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={eyebrow}>Step 1 of 2 · {host}</span>
              <h2 style={heading}>What is this audit for?</h2>
              <p style={{ margin: 0, font: t(400, 14, 22), color: color.inkSecondary }}>
                Every check runs either way. Your goal decides what counts most.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div role="radiogroup" aria-label="Audit goal" data-goal-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {GOALS.map((g) => {
                  const on = g.id === goal;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setGoal(g.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: 12,
                        borderRadius: radius.sm,
                        cursor: 'pointer',
                        background: on ? color.blueTint : color.surface,
                        border: `1px solid ${on ? color.blue : color.border}`,
                        color: 'inherit',
                      }}
                    >
                      {on ? (
                        <Tick />
                      ) : (
                        <span aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0, borderRadius: radius.sm, boxShadow: 'inset 0 0 0 1.5px #C9CDD4' }} />
                      )}
                      <span style={{ font: t(600, 14, 20), color: color.ink }}>{g.name}</span>
                    </button>
                  );
                })}
              </div>
              <p key={goal} style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'baseline', font: t(400, 13, 20), color: color.inkSecondary }}>
                <span style={{ fontWeight: 600, color: color.accentFg }}>Focus</span>
                {FOCUS[goal]}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <button type="button" data-cta="primary" onClick={start} style={primaryWide}>
                Run the audit
              </button>
              <button type="button" onClick={close} style={plainAction}>
                Cancel
              </button>
            </div>
            {credits != null && (
              <span style={{ font: t(400, 12, 16), color: color.inkMuted }}>
                {credits} credit{credits === 1 ? '' : 's'} left
              </span>
            )}
          </>
        )}

        {/* ------------------------------------------ step 2: running, done */}
        {(stage === 'running' || stage === 'done') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <span style={eyebrow}>Step 2 of 2 · {host}</span>
                <h2 style={heading}>{stage === 'done' ? 'Audit complete' : STAGES[stageIndex]}</h2>
              </div>
              <span style={{ font: t(700, 28, 1), letterSpacing: tracking.tight, color: color.blue }}>
                {pct}
                <span style={{ font: t(600, 14, 1), color: color.inkMuted }}>%</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div role="progressbar" aria-label="Audit progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, background: '#EEF0F3', borderRadius: radius.button, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(2, pct)}%`, height: '100%', borderRadius: radius.button, background: color.blue, transition: 'width .6s cubic-bezier(.2,.7,.2,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span key={stageIndex} aria-live="polite" style={{ font: t(400, 13, 20), color: color.inkSecondary }}>
                  {stage === 'done' && result
                    ? `${result.findings.length} issue${result.findings.length === 1 ? '' : 's'} found, ranked by what to fix first`
                    : line}
                </span>
                <span style={{ font: t(500, 13, 20), color: color.inkMuted }}>{elapsed}s</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${color.border}`, borderRadius: radius.sm }}>
              {STAGES.map((label, i) => {
                const doneUpTo = stage === 'done' ? STAGES.length : stageIndex;
                const done = i < doneUpTo;
                const active = i === doneUpTo;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < STAGES.length - 1 ? '1px solid #F0F1F3' : 'none' }}>
                    <span style={{ display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center', color: done ? color.blue : active ? color.ink : '#A1A6AE' }}>
                      {done ? (
                        <span style={{ width: 18, height: 18, borderRadius: radius.sm, background: color.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 13 4 4L19 7" />
                          </svg>
                        </span>
                      ) : active ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ animation: 'ax-spin 0.9s linear infinite' }}>
                          <path d="M12 3a9 9 0 1 0 9 9" />
                        </svg>
                      ) : (
                        <span style={{ width: 18, height: 18, borderRadius: radius.sm, boxShadow: `inset 0 0 0 1.5px ${color.borderStrong}` }} />
                      )}
                    </span>
                    <span style={{ font: t(500, 14, 20), color: i <= doneUpTo ? color.ink : color.inkMuted }}>{label}</span>
                  </div>
                );
              })}
            </div>

            {stage === 'running' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={close} style={{ ...plainAction, padding: '12px 0' }}>
                  Cancel the run
                </button>
                <span style={{ flexGrow: 1 }} />
                <span style={{ font: t(400, 12, 16), color: color.inkMuted }}>Real browser · desktop and mobile</span>
              </div>
            )}

            {stage === 'done' && result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: color.bgSubtle, borderRadius: radius.sm, padding: '14px 16px' }}>
                  <span style={{ font: t(600, 14, 20), color: color.ink }}>Your score</span>
                  <span style={{ font: t(800, 24, 1), letterSpacing: tracking.tight, color: color.ink }}>
                    {result.overall ?? '—'}
                    <span style={{ font: t(600, 13, 1), color: color.inkMuted }}>
                      {result.overall == null ? ' · not scored' : `/100 · ${result.band}`}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="button" data-cta="primary" onClick={() => router.push(`/report/${result.id}`)} style={primaryWide}>
                    View the report
                  </button>
                  <button type="button" onClick={start} style={plainAction}>
                    Run again
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------------------------------------------------------- error */}
        {stage === 'error' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ ...eyebrow, color: color.critical }}>{host || 'Audit'}</span>
              <h2 style={heading}>The audit could not complete</h2>
              <p style={{ margin: 0, font: t(400, 14, 22), color: color.inkSecondary }}>{error}</p>
            </div>
            {refunded && (
              <p style={{ margin: 0, padding: '12px 14px', background: color.bgSubtle, borderRadius: radius.sm, font: t(400, 13, 20), color: color.inkSecondary }}>
                Your credit has been returned — a run that produces nothing is not one you paid for.
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {action === 'signin' ? (
                <button type="button" data-cta="primary" onClick={() => window.location.assign('/signin')} style={primaryWide}>
                  Sign in
                </button>
              ) : action === 'buy' ? (
                <button type="button" data-cta="primary" onClick={() => window.location.assign('/account')} style={primaryWide}>
                  Top up
                </button>
              ) : (
                <button type="button" data-cta="primary" onClick={start} style={primaryWide}>
                  Try again
                </button>
              )}
              <button type="button" onClick={close} style={plainAction}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
