import { SITE } from './config.js';

/**
 * The audit runs here rather than in the popup, because Chrome destroys a popup
 * the moment it loses focus and an audit takes minutes. The popup only reads the
 * state this writes to storage, so it can close and reopen without touching the run.
 *
 * chrome.storage.session  run    — the current audit; gone when the browser closes
 * chrome.storage.local    recent — summaries of finished audits
 */

const RECENT_LIMIT = 10;
const BLUE = '#146EF5';
const GREEN = '#15803D';
const ORANGE = '#C2410C';
const RED = '#E5484D';

/** Set for as long as this worker has a run in flight. */
let controller = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'start') run(message.url, message.goals);
  if (message.type === 'cancel') controller?.abort();
});

// A worker that starts up holding no controller cannot own the run in storage:
// Chrome ended the previous worker, and its stream went with it. The popup sends
// a message on opening, which is what wakes this.
chrome.storage.session.get('run').then(({ run }) => {
  if (run?.status === 'running' && !controller) {
    fail(run, 'The audit was interrupted. Try again.');
  }
});

async function run(url, goals) {
  if (controller) return;
  const current = new AbortController();
  controller = current;
  const state = { status: 'running', url, goals, stageIndex: 0, startedAt: Date.now() };

  try {
    await chrome.storage.session.set({ run: state });
    await badge('…', BLUE);

    const { email } = await chrome.storage.local.get('email');
    const res = await fetch(`${SITE}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, goals, email }),
      credentials: 'include',
      signal: current.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Audix answered with an error (${res.status}). Try again.`);

    const finished = await readStream(res.body, state);
    // The host ends a function at its time limit by closing the connection, so a
    // stream can end cleanly without ever having said how the audit went.
    if (!finished) throw new Error('The audit took too long and was stopped. Try again.');
  } catch (err) {
    if (current.signal.aborted) {
      await chrome.storage.session.remove('run');
      await badge('');
    } else {
      await fail(state, err instanceof TypeError ? 'Could not reach Audix. Check your connection and try again.' : err.message);
    }
  } finally {
    controller = null;
  }
}

/** Reads the NDJSON stream. Resolves true once the audit has reported an outcome. */
async function readStream(body, state) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return finished;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf('\n');
      if (!line) continue;

      const event = JSON.parse(line);
      if (event.type === 'ping') {
        // Chrome ends a worker after 30 idle seconds, and reading a stream does
        // not count as activity. Calling an extension API does.
        await chrome.storage.session.set({ alive: Date.now() });
      } else if (event.type === 'check') {
        state.check = event.label;
        state.checksDone = Math.max(event.done, state.checksDone ?? 0);
        await chrome.storage.session.set({ run: state });
      } else if (event.type === 'stage') {
        state.stageIndex = event.index;
        state.check = null;
        await chrome.storage.session.set({ run: state });
      } else if (event.type === 'result') {
        await finish(state, event.result);
        finished = true;
      } else if (event.type === 'error') {
        await fail(state, event.message, event.action);
        finished = true;
      }
    }
  }
}

async function finish(state, result) {
  const summary = summarize(state.url, result);
  const { recent = [] } = await chrome.storage.local.get('recent');
  await chrome.storage.local.set({
    recent: [summary, ...recent.filter((r) => r.url !== summary.url)].slice(0, RECENT_LIMIT),
  });
  await chrome.storage.session.set({ run: { status: 'done', summary } });
  await badge(result.overall == null ? '?' : String(result.overall), bandColor(result.overall));
}

async function fail(state, message, action) {
  await chrome.storage.session.set({ run: { status: 'error', url: state.url, goals: state.goals, message, action } });
  await badge('!', RED);
}

/** A result is up to 600 kB of screenshots and evidence. The popup needs this much; the report page fetches the rest. */
function summarize(url, result) {
  const expertFixes = result.expert?.takeaways?.fix;
  const fixes = expertFixes?.length ? expertFixes : result.priorities.map((p) => p.problem);
  return {
    id: result.id,
    url,
    overall: result.overall,
    band: result.band,
    goals: result.goal.ids,
    goal: result.goal.name,
    counts: { critical: result.counts[4] ?? 0, major: result.counts[3] ?? 0, minor: result.counts[2] ?? 0 },
    // Two criteria can fail on the same fault, and name it the same way.
    fixes: [...new Set(fixes)].slice(0, 3),
    at: Date.now(),
  };
}

function bandColor(score) {
  if (score == null) return BLUE;
  if (score >= 70) return GREEN;
  return score >= 50 ? ORANGE : RED;
}

async function badge(text, color) {
  await chrome.action.setBadgeText({ text });
  if (color) await chrome.action.setBadgeBackgroundColor({ color });
}
