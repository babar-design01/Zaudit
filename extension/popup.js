import { SITE } from './config.js';

/** Mirrors STAGES in src/hooks/useAudit.ts, in the order the engine reports them. */
const STAGES = [
  'Loading and measuring the page',
  'Working out what kind of page this is',
  'Judging it against the criteria',
  'Checking the findings against their evidence',
  'Scoring the pillars against your goal',
];

/** Mirrors GOALS in src/lib/audit/framework.ts, with the default first. */
const DEFAULT_GOAL = 'health';
const GOALS = [
  ['health', 'General health check'],
  ['conversion', 'Improve conversion'],
  ['accessible', 'Make it accessible'],
  ['redesign', 'Redesign or modernise'],
  ['support', 'Reduce support tickets'],
  ['prelaunch', 'Pre-launch QA'],
];

const view = document.getElementById('view');
let tabUrl = null;
let clock = null;
/** The result this popup is showing, held so it stays up once it has been marked as seen. */
let shown = null;
/** Set when the reader asks to run this page again, so its old result stops answering for it. */
let rerunGoals = null;

/** Builds an element. Audit text comes from other people's pages, so it only ever goes in as text. */
function h(tag, props = {}, ...children) {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...children.filter((c) => c != null));
  return el;
}

/** The address to audit, or null where there is no web page: chrome://, a new tab, a local file. */
function auditable(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '');

function openTab(url) {
  chrome.tabs.create({ url });
  window.close();
}

function reportUrl(id) {
  return `${SITE}/report/${encodeURIComponent(id)}`;
}

function start(url, goals) {
  shown = null;
  rerunGoals = null;
  chrome.runtime.sendMessage({ type: 'start', url, goals });
}

/** Mirrors toggleGoal in src/lib/audit/framework.ts. */
function toggleGoal(current, id) {
  if (id === DEFAULT_GOAL) return [DEFAULT_GOAL];
  const next = current.includes(id) ? current.filter((g) => g !== id) : [...current.filter((g) => g !== DEFAULT_GOAL), id];
  return next.length ? next : [DEFAULT_GOAL];
}

/** Results saved before goals could be combined hold a single id. */
const goalsOf = (summary) => summary.goals ?? (summary.goalId ? [summary.goalId] : [DEFAULT_GOAL]);

async function refresh() {
  clearInterval(clock);
  const [{ run }, { recent = [], goal = DEFAULT_GOAL, goals = [goal], email = '' }] = await Promise.all([
    chrome.storage.session.get('run'),
    chrome.storage.local.get(['recent', 'goal', 'goals', 'email']),
  ]);

  if (run?.status === 'running') {
    shown = null;
    return view.replaceChildren(...runningView(run));
  }
  if (run?.status === 'error') return view.replaceChildren(...errorView(run));
  if (run?.status === 'done') {
    // Seen now, so the toolbar stops announcing it and the next open starts from this tab.
    shown = run.summary;
    await chrome.storage.session.remove('run');
    await chrome.action.setBadgeText({ text: '' });
  }

  const summary = shown || (rerunGoals ? null : recent.find((r) => r.url === tabUrl));
  view.replaceChildren(...(summary ? resultView(summary) : idleView(rerunGoals || goals, recent, email)));
}

function idleView(goals, recent, email) {
  let chosen = goals;
  const boxes = GOALS.map(([id, name]) => {
    const input = h('input', {
      type: 'checkbox',
      checked: chosen.includes(id),
      onchange: () => {
        chosen = toggleGoal(chosen, id);
        // Choosing one goal can clear another, so every box is set again.
        boxes.forEach((box) => {
          box.input.checked = chosen.includes(box.id);
        });
        chrome.storage.local.set({ goals: chosen });
      },
    });
    return { id, input, label: h('label', { className: 'check' }, input, name) };
  });
  const emailInput = h('input', { type: 'email', value: email, placeholder: 'you@company.com', autocomplete: 'email', required: true });
  const emailNote = h('p', { className: 'muted', textContent: 'Required. We keep it with your audit and may contact you about your results.' });
  const run = async (event) => {
    event.preventDefault();
    const typed = emailInput.value.trim().toLowerCase();
    // Mirrors normalizeEmail in src/lib/email.ts, which is the check that counts.
    if (typed.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(typed)) {
      emailNote.textContent = 'Enter a valid email to run the audit.';
      emailNote.className = 'error';
      emailInput.focus();
      return;
    }
    // Stored first, because the worker reads it from here.
    await chrome.storage.local.set({ email: typed });
    start(tabUrl, chosen);
  };
  const heading = tabUrl
    ? [h('h1', { textContent: 'Audit this page' }), h('p', { className: 'host', textContent: tabUrl })]
    : [h('h1', { textContent: 'Open a website to audit it' }), h('p', { className: 'muted', textContent: 'Audix can only audit public web pages.' })];

  return [
    h('div', { className: 'section' }, ...heading),
    tabUrl
      ? h(
          'form',
          { className: 'section form', noValidate: true, onsubmit: run },
          h('fieldset', { className: 'goals' }, h('legend', { textContent: 'Goals (pick one or more)' }), ...boxes.map((box) => box.label)),
          h('label', {}, 'Your email', emailInput),
          emailNote,
          h('button', { className: 'primary', type: 'submit', textContent: 'Run audit' }),
        )
      : null,
    tabUrl ? h('p', { className: 'muted', textContent: 'Audix opens this address in its own browser, signed out. A page behind a login is audited as its login screen.' }) : null,
    recent.length ? recentList(recent) : null,
  ].filter(Boolean);
}

function recentList(recent) {
  return h(
    'div',
    { className: 'section' },
    h('div', { className: 'eyebrow', textContent: 'Recent audits' }),
    h(
      'ul',
      { className: 'recent' },
      ...recent.slice(0, 3).map((r) =>
        h(
          'li',
          {},
          h(
            'button',
            { onclick: () => openTab(reportUrl(r.id)) },
            h('span', { textContent: hostOf(r.url) }),
            h('b', { textContent: r.overall ?? '–' }),
          ),
        ),
      ),
    ),
  );
}

function runningView(run) {
  const time = h('p', { className: 'muted' });
  const tick = () => {
    const seconds = Math.max(0, Math.round((Date.now() - run.startedAt) / 1000));
    time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} elapsed. You can close this, the audit keeps running.`;
  };
  tick();
  clock = setInterval(tick, 1000);

  return [
    h('div', { className: 'section' }, h('h1', { textContent: 'Auditing…' }), h('p', { className: 'host', textContent: run.url }), run.check ? h('p', { className: 'muted', textContent: `Checking ${run.check}` }) : null),
    h(
      'ol',
      { className: 'stages' },
      ...STAGES.map((label, i) =>
        h(
          'li',
          { className: i < run.stageIndex ? 'done' : i === run.stageIndex ? 'current' : '' },
          h('span', { className: 'dot' }),
          label,
        ),
      ),
    ),
    time,
    h('button', { className: 'secondary', textContent: 'Cancel', onclick: () => chrome.runtime.sendMessage({ type: 'cancel' }) }),
  ];
}

function errorView(run) {
  const dismiss = async () => {
    await chrome.storage.session.remove('run');
    await chrome.action.setBadgeText({ text: '' });
  };
  // What would fix it, when something would: the same two the site's dialog offers.
  const fix = {
    signin: ['Sign in', `${SITE}/signin`],
    buy: ['Get more audits', `${SITE}/account`],
  }[run.action];

  return [
    h(
      'div',
      { className: 'section' },
      h('h1', { textContent: 'The audit did not finish' }),
      h('p', { textContent: run.message }),
      h('p', { className: 'muted', textContent: run.url }),
    ),
    h(
      'div',
      { className: 'actions' },
      fix
        ? h('button', { className: 'primary', textContent: fix[0], onclick: () => dismiss().then(() => openTab(fix[1])) })
        : h('button', { className: 'primary', textContent: 'Try again', onclick: () => dismiss().then(() => start(run.url, run.goals ?? [DEFAULT_GOAL])) }),
      h('button', { className: 'secondary', textContent: 'Back', onclick: dismiss }),
    ),
  ];
}

function ago(at) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Nothing was measured, so zero issues would read as a clean page. It says what happened instead. */
function unscoredView(summary) {
  return [
    h(
      'div',
      { className: 'section' },
      h('p', { className: 'host', textContent: hostOf(summary.url) }),
      h('h1', { textContent: 'This page could not be scored' }),
      h('p', { textContent: 'Audix could not finish loading it, so too little was measured to give a score. This is often temporary.' }),
      h('p', { className: 'muted', textContent: `${summary.goal} · ${ago(summary.at)}` }),
    ),
    h(
      'div',
      { className: 'actions' },
      h('button', { className: 'primary', textContent: 'Try again', onclick: () => start(summary.url, goalsOf(summary)) }),
      h('button', { className: 'secondary', textContent: 'See what was checked', onclick: () => openTab(reportUrl(summary.id)) }),
    ),
  ];
}

function resultView(summary) {
  if (summary.overall == null) return unscoredView(summary);
  const { overall, band, counts, fixes } = summary;
  const isThisTab = summary.url === tabUrl;
  const next = () => {
    shown = null;
    // Back to the form, so a second run can use a different goal. For another
    // page, this goes to whatever this tab already has.
    if (isThisTab) rerunGoals = goalsOf(summary);
    refresh();
  };

  return [
    h(
      'div',
      { className: 'section' },
      h('p', { className: 'host', textContent: hostOf(summary.url) }),
      h('div', { className: 'score' }, h('strong', { textContent: overall }), h('span', { className: `band-${band}`, textContent: band })),
      h('p', { className: 'muted', textContent: `${summary.goal} · ${ago(summary.at)}` }),
    ),
    h(
      'dl',
      { className: 'counts' },
      ...[['Critical', counts.critical], ['Major', counts.major], ['Minor', counts.minor]].map(([name, n]) =>
        h('div', {}, h('dt', { textContent: name }), h('dd', { textContent: n })),
      ),
    ),
    fixes.length
      ? h(
          'div',
          { className: 'section' },
          h('div', { className: 'eyebrow', textContent: 'Fix first' }),
          h('ol', { className: 'fixes' }, ...fixes.map((f) => h('li', { textContent: f }))),
        )
      : null,
    h(
      'div',
      { className: 'actions' },
      h('button', { className: 'primary', textContent: 'Open full report', onclick: () => openTab(reportUrl(summary.id)) }),
      h('button', { className: 'secondary', textContent: isThisTab ? 'Run again' : tabUrl ? 'Audit this page' : 'Back', onclick: next }),
    ),
  ].filter(Boolean);
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.run) refresh();
});

chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
  tabUrl = auditable(tab?.url);
  // Wakes the worker, which is what notices a run its predecessor left behind.
  chrome.runtime.sendMessage({ type: 'wake' }).catch(() => {});
  await refresh();
});
