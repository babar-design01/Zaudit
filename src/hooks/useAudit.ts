'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { rememberReport } from '@/components/report/ReportView';
import { DEFAULT_GOAL, type GoalId } from '@/lib/audit/framework';
import type { AuditEvent, AuditResult } from '@/lib/audit/types';

export type AuditStage = 'idle' | 'goal' | 'running' | 'error' | 'done';

/** The engine's stages, in the order `audit()` reports them. */
export const STAGES = [
  'Loading and measuring the page',
  'Working out what kind of page this is',
  'Judging it against the criteria',
  'Checking the findings against their evidence',
  'Scoring the pillars against your goal',
];

export type AuditState = {
  stage: AuditStage;
  url: string;
  /** The goal the audit is weighted for. */
  goal: GoalId;
  stageIndex: number;
  /** Whole seconds since `start`, for the dialog's clock. */
  elapsed: number;
  /** When the current stage began, so the dialog can ease progress within it. */
  stageStartedAt: number;
  result: AuditResult | null;
  error: string | null;
  quota: boolean;
  /** What would fix the error, when something would. */
  action?: 'signin' | 'buy';
  /** Credits left after this run, when accounts are on. */
  credits: number | null;
  /** The run failed and the credit came back. */
  refunded: boolean;
  /** The dialog is open from `start` until the reader dismisses it. */
  dialogOpen: boolean;
};

/** Drives the hero's four states off the /api/audit NDJSON stream. */
export function useAudit() {
  const [state, setState] = useState<AuditState>({
    stage: 'idle',
    url: '',
    goal: DEFAULT_GOAL,
    stageIndex: 0,
    elapsed: 0,
    stageStartedAt: 0,
    result: null,
    error: null,
    quota: false,
    credits: null,
    refunded: false,
    dialogOpen: false,
  });

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTick = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  /** Lets closing the dialog actually stop the request rather than orphan it. */
  const inFlight = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      stopTick();
      inFlight.current?.abort();
    },
    [stopTick],
  );

  // Mirrors state for `start`, which needs the current url and stage without
  // reading them inside a setState updater (updaters must stay pure).
  const latest = useRef(state);
  latest.current = state;

  const setUrl = useCallback((url: string) => setState((s) => ({ ...s, url })), []);
  const setGoal = useCallback((goal: GoalId) => setState((s) => ({ ...s, goal })), []);

  /**
   * The framework asks for the goal before the audit starts, because the goal
   * sets the weights. The dialog opens on that question rather than on a
   * spinner, with the general health check already chosen for anyone who just
   * wants to run it.
   */
  const openGoal = useCallback(() => {
    if (latest.current.stage === 'running') return;
    // Every "Run free audit" on the page opens the dialog, but the dialog needs
    // an address. Without one, the reader is taken to the field that asks for
    // it rather than shown an error for a question they were never asked.
    if (!latest.current.url.trim()) {
      focusHero();
      return;
    }
    setState((s) => ({ ...s, stage: 'goal', error: null, result: null, dialogOpen: true }));
  }, []);

  const start = useCallback(async () => {
    if (latest.current.stage === 'running') return;

    const target = latest.current.url.trim();
    if (!target) {
      setState((s) => ({
        ...s,
        stage: 'error',
        error: 'Enter a website address first.',
        quota: false,
        dialogOpen: true,
      }));
      return;
    }

    const t0 = Date.now();
    setState((s) => ({
      ...s,
      stage: 'running',
      stageIndex: 0,
      elapsed: 0,
      stageStartedAt: t0,
      error: null,
      result: null,
      dialogOpen: true,
    }));

    stopTick();
    tick.current = setInterval(
      () => setState((s) => ({ ...s, elapsed: Math.round((Date.now() - t0) / 1000) })),
      1000,
    );

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, goal: latest.current.goal }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error('The audit stream could not be opened.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read NDJSON lines as they arrive so progress advances with the engine.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newline = buffer.indexOf('\n');
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');
          if (!line) continue;

          const event = JSON.parse(line) as AuditEvent;
          if (event.type === 'ping') {
            continue;
          } else if (event.type === 'stage') {
            setState((s) => ({ ...s, stageIndex: event.index, stageStartedAt: Date.now() }));
          } else if (event.type === 'credits') {
            // What the run cost, as it is taken, and again if it comes back.
            setState((s) => ({ ...s, credits: event.left ?? s.credits, refunded: event.refunded || s.refunded }));
          } else if (event.type === 'result') {
            stopTick();
            rememberReport(event.result);
            setState((s) => ({ ...s, stage: 'done', result: event.result }));
          } else if (event.type === 'error') {
            stopTick();
            setState((s) => ({ ...s, stage: 'error', error: event.message, quota: event.quota, action: event.action }));
          }
        }
      }
    } catch (err) {
      stopTick();
      // A cancelled audit is not a failure — the reader closed the dialog.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setState((s) => ({
        ...s,
        stage: 'error',
        error: err instanceof Error ? err.message : String(err),
        quota: false,
      }));
    }
  }, [stopTick]);

  const reset = useCallback(() => {
    stopTick();
    inFlight.current?.abort();
    setState((s) => ({
      ...s,
      stage: 'idle',
      result: null,
      error: null,
      stageIndex: 0,
      elapsed: 0,
      dialogOpen: false,
    }));
  }, [stopTick]);

  /**
   * Closes the dialog. A run still in flight is cancelled rather than left to
   * finish unwatched; a finished one keeps its result, so the hero still shows
   * the score once the dialog is out of the way.
   */
  const closeDialog = useCallback(() => {
    setState((s) => {
      if (s.stage === 'running') {
        stopTick();
        inFlight.current?.abort();
        return { ...s, stage: 'idle', stageIndex: 0, elapsed: 0, dialogOpen: false };
      }
      return { ...s, dialogOpen: false };
    });
  }, [stopTick]);

  return { state, setUrl, setGoal, openGoal, start, reset, closeDialog };
}

/** Scrolls to the hero and focuses the URL field — every CTA on the page lands here. */
export function focusHero() {
  const el = document.getElementById('hero-url');
  if (!el) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => el.focus(), 320);
}
