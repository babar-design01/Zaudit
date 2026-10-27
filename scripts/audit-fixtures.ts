/**
 * Runs the contract engine against fixture pages in a real browser and checks
 * each rule's outcome. `npm run test:audit`.
 *
 *  - BAD trips as many ACC rules as can be triggered offline.
 *  - GOOD follows every rule, and must produce no confirmed finding.
 *  - The L3 validators are fed model replies that try to break the contract.
 */
import sharp from 'sharp';
import { measurePage } from '../src/lib/audit/browser';
import { deltaE } from '../src/lib/audit/color';
import { classifyBySignals } from '../src/lib/audit/classify';
import type { ContractFinding, PageType, PageTypeResult, RuleOutcome } from '../src/lib/audit/contract';
import { docFacts, parseHtml } from '../src/lib/audit/document';
import { MISSING_CHECKS, ORPHAN_CHECKS } from '../src/lib/audit/catalog';
import { evaluate, holdAssisted, type Evaluation } from '../src/lib/audit/evaluate';
import { GOALS, type GoalId } from '../src/lib/audit/framework';
import { applyReview, fixProblem, proseProblem, type ReviewReply } from '../src/lib/audit/review';
import { score } from '../src/lib/audit/score';
import { acceptExpertReply, type ExpertReply } from '../src/lib/audit/expert';
import type { Anchor } from '../src/lib/audit/probe-anchors';

const img = (w: number, h: number, fill = '#8aa') =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${fill}"/></svg>`)}`;

const BAD = `<!doctype html><html><head><title>Home</title>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
  body { font-family: Arial, sans-serif; margin: 16px; background: #fff; color: #111; }
  a, button, input { outline: none; }
  .low { color: #aaaaaa; font-size: 14px; }
  .big { color: #c4c4c4; font-size: 32px; margin: 0; }
  input.bare { border: 0; background: #fff; padding: 8px; font-size: 14px; }
  .spin { display: inline-block; animation: spin 2s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .tiny { display: inline-block; width: 14px; height: 14px; background: #333; margin-right: 2px; }
  .dots span { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
  .dots .ok { background: #22aa22; } .dots .bad { background: #cc2222; }
  .row { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 12px; }
  .row a, nav a { padding: 4px; }
  button.icon { background: #eee; border: 0; width: 40px; height: 40px; }
</style></head>
<body>
  <nav><a href="/a">Alpha</a> <a href="/b">Beta</a> <a href="/c">Gamma</a> <a href="/d">Delta</a> <a href="/e">Epsilon</a> <a href="/f">Zeta</a></nav>
  <h2>Welcome to the product</h2>
  <h4>A heading that skips a level</h4>
  <p class="low">This body copy is set in a pale grey that is hard to read on white.</p>
  <p class="big">A faint large headline</p>
  <input class="bare" placeholder="Email address">
  <img src="${img(200, 120)}" alt="hero-bg-final-v3.png" width="200" height="120">
  <img src="${img(300, 160, '#a88')}" width="300" height="160">
  <button class="icon menu-toggle"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 4h16v2H2zM2 9h16v2H2zM2 14h16v2H2z"/></svg></button>
  <p><a href="/x">Learn more</a> · <a href="/y">Read more</a></p>
  <div class="row"><a href="#1">One</a><a href="#2">Two</a><a href="#3">Three</a><a href="#4">Four</a></div>
  <p><span class="spin">⟳</span> Loading</p>
  <div class="dots status"><span class="ok"></span><span class="bad"></span></div>
  <p><a class="tiny" href="/t1"></a><a class="tiny" href="/t2"></a></p>
</body></html>`;

const GOOD = `<!doctype html><html lang="en"><head><title>Pricing plans | Acme</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: Arial, sans-serif; margin: 0; background: #fff; color: #1a1a1a; }
  .skip { position: absolute; left: -9999px; }
  .skip:focus { left: 8px; top: 8px; }
  :focus-visible { outline: 3px solid #1a4fd6; outline-offset: 2px; }
  nav a, .cta, button { display: inline-block; min-width: 44px; min-height: 44px; padding: 12px 16px; box-sizing: border-box; color: #1a1a1a; }
  main { padding: 24px; }
  label { display: block; margin-top: 12px; }
  input { border: 1px solid #6b6b6b; padding: 12px; font-size: 16px; min-height: 44px; box-sizing: border-box; }
  nav a:hover, .cta:hover, button:hover { background: #eef2ff; } nav a:active, .cta:active, button:active { background: #dde4ff; }
  .card { transition: transform 400ms ease; }
  .card:hover { transform: translateY(-2px); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
</style></head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header><nav aria-label="Main"><a href="/product">Product</a><a href="/pricing">Pricing</a><a href="/docs">Docs</a><a href="/blog">Blog</a><a href="/login">Log in</a></nav></header>
  <main id="main">
    <h1>Plans that grow with your team</h1>
    <h2>Compare plans</h2>
    <p>Start on the free plan and upgrade when you need more seats.</p>
    <img src="${img(320, 180)}" alt="Plan comparison: Free includes 3 seats, Team includes 20" width="320" height="180">
    <form><label for="email">Work email</label><input id="email" type="email">
    <button type="submit">Start free trial</button></form>
    <div class="card"><h3>Team plan</h3><a class="cta" href="/pricing/team">See the Team plan</a></div>
  </main>
</body></html>`;

/* ------------------------------------------------------------ UX pages */

const LONG = 'Our platform brings planning, tracking and reporting into one place so that every team can see what is happening across projects without chasing updates in chat threads or spreadsheets. '.repeat(8);

/** A landing page served at /features: competing CTAs, placeholder labels, an unmarked current nav item, a wall of wide text, a hover-only menu and a toast that vanishes. */
const UX_LANDING = `<!doctype html><html lang="en"><head><title>Features | Acme</title><style>
  body { font-family: Arial, sans-serif; margin: 0; color: #1a1a1a; background: #fff; }
  nav a, .menu { display: inline-block; padding: 12px 16px; color: #1a1a1a; text-decoration: none; }
  .menu { position: relative; }
  .menu .sub { display: none; position: absolute; top: 40px; left: 0; background: #fff; border: 1px solid #ccc; }
  .menu:hover .sub { display: block; }
  .btn { display: inline-block; background: #1a4fd6; color: #fff; padding: 14px 0; width: 180px; text-align: center; text-decoration: none; font-size: 16px; }
  .wide { width: 1400px; font-size: 16px; line-height: 1.5; margin: 16px 0 0; }
  .toast { position: fixed; bottom: 20px; right: 20px; background: #222; color: #fff; padding: 12px; }
</style></head><body>
  <header><nav aria-label="Main"><a href="/">Home</a><a href="/features">Features</a><a href="/pricing">Pricing</a><div class="menu">Resources<div class="sub"><a href="/guides">Guides</a><a href="/webinars">Webinars</a></div></div></nav></header>
  <main><section>
    <h1>Ship faster with Acme</h1>
    <a class="btn" href="/signup">Start free trial</a> <a class="btn" href="/contact-sales">Book a call</a>
    <form><input type="text" aria-label="Name" placeholder="Your name"> <input type="email" aria-label="Email" placeholder="Work email"> <button type="submit">Send</button></form>
    <p class="wide">${LONG}</p>
  </section></main>
  <script>setTimeout(() => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = 'Your settings were saved to the cloud and will sync across all of your devices shortly'; document.body.appendChild(t); setTimeout(() => t.remove(), 1200); }, 900);</script>
</body></html>`;

/** Step 2 of 4 of an onboarding flow, with every form problem the catalog names. */
const UX_FORM = `<!doctype html><html lang="en"><head><title>Your profile | Acme</title><style>
  body { font-family: Arial, sans-serif; margin: 24px; } label { display: block; margin-top: 8px; } .error { color: #b00020; margin-left: 8px; }
</style></head><body><main>
  <p>Step 2 of 4</p><h1>Your profile</h1><p>Plan: Team, $49 per month</p>
  <form id="f">
    <label for="em">Email</label><input id="em" type="email" required>
    <label for="pw">Password</label><input id="pw" type="password" required minlength="8">
    <label for="ph">Phone</label><input id="ph" name="phone" type="tel" required>
    <label for="co">Company</label><input id="co" name="company" required>
    <label for="jt">Job title</label><input id="jt" name="job">
    <button type="submit">Submit</button>
  </form>
  <script>document.querySelectorAll('#f input').forEach((i) => i.addEventListener('invalid', () => {
    if (i.nextElementSibling && i.nextElementSibling.classList.contains('error')) return;
    const e = document.createElement('span'); e.className = 'error';
    e.textContent = 'Invalid ' + i.previousElementSibling.textContent.toLowerCase(); i.after(e);
  }));</script>
</main></body></html>`;

/** The same step, built the way the catalog asks. */
const UX_FORM_GOOD = `<!doctype html><html lang="en"><head><title>Your profile | Acme</title><style>
  body { font-family: Arial, sans-serif; margin: 24px; } label { display: block; margin-top: 8px; } .error { color: #b00020; }
</style></head><body><main>
  <p>Step 2 of 4</p><h1>Your profile</h1>
  <form id="f">
    <label for="em">Email</label><input id="em" type="email" required aria-describedby="em-err"> <span id="em-err" class="error"></span>
    <label for="nm">Name</label><input id="nm" required>
    <label for="jt">Job title (optional)</label><input id="jt" name="job">
    <label for="ci">City (optional)</label><input id="ci" name="city">
    <button type="button">Back</button> <button type="submit">Create account</button>
  </form>
  <script>const em = document.getElementById('em'), err = document.getElementById('em-err');
  em.addEventListener('blur', () => { if (em.value && !em.checkValidity()) { em.setAttribute('aria-invalid', 'true'); err.textContent = 'Enter an email like name@example.com'; } else { em.removeAttribute('aria-invalid'); err.textContent = ''; } });</script>
</main></body></html>`;

const FRUIT = ['Mango', 'Apple', 'Quince', 'Banana', 'Kiwi', 'Cherry', 'Lime', 'Date', 'Fig', 'Grape', 'Lemon', 'Melon', 'Nectarine', 'Olive', 'Papaya', 'Pear', 'Plum', 'Guava', 'Raisin', 'Sloe', 'Tangerine', 'Ugli', 'Yuzu', 'Apricot', 'Blueberry', 'Coconut', 'Durian', 'Elderberry', 'Feijoa', 'Jackfruit'];
/** A listing: 30 unsorted items with no search, and an empty panel with nothing to do. */
const UX_LIST = `<!doctype html><html lang="en"><head><title>Catalogue | Acme</title><style>body { font-family: Arial; margin: 16px; } li { line-height: 20px; } .panel { position: absolute; left: 700px; top: 80px; width: 400px; height: 200px; border: 1px solid #ccc; padding: 16px; }</style></head>
<body><main><h1>Catalogue</h1><ul class="items">${FRUIT.map((f) => `<li class="item">${f} crate</li>`).join('')}</ul>
<div class="panel"><h2>Saved</h2><p>No saved items yet</p></div></main></body></html>`;

/** A modal over the page with no way out. */
const MODAL = (extra = '') => `<!doctype html><html lang="en"><head><title>Welcome | Acme</title></head><body style="font-family: Arial; margin: 16px">
<main><h1>Welcome</h1><p>Content behind the dialog.</p><a href="/x">A link</a></main>
<div class="overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100">
  <div role="dialog" aria-modal="true" aria-label="Join our newsletter" style="position: absolute; top: 200px; left: 470px; width: 500px; background: #fff; padding: 24px">
    <h2>Join our newsletter</h2><label for="nl">Email</label> <input id="nl" type="email"> <button>Subscribe</button>${extra}
  </div>
</div></body></html>`;

/* ------------------------------------------------------------ UI pages */

const stripes = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ffffff"/><rect width="20" height="40" fill="#f6e27a"/></svg>')}`;

/** Breaks every measurable UI rule; `png` is a 200×100 raster drawn square. */
const UI_BAD = (png: string) => `<!doctype html><html lang="en"><head><title>Tools | Acme</title><style>
  :root { --bg: #fff; --fg: #111; } [data-theme="dark"] { --bg: #111; --fg: #eee; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: Arial, sans-serif; font-size: 14px; }
  .w1 { max-width: 1300px; margin: 0 auto; } .w2 { max-width: 1000px; margin: 0 auto; } .w3 { max-width: 760px; margin: 0 auto; }
  header { padding: 7px 13px; }
  h1 { font-size: 20px; font-weight: 400; color: #777; margin: 3px 0; display: inline-block; }
  .badge { font-size: 28px; font-weight: 700; color: #fff; background: #e0245e; border-radius: 12px; padding: 2px 10px; line-height: 1.2; margin-left: 11px; }
  .s span { margin-right: 5px; } .t1 { color: #1A1A1A; } .t2 { color: #1C1C1C; } .t3 { color: #1B1B1B; }
  .f2 { font-family: Georgia, serif; } .f3 { font-family: 'Courier New', monospace; } .f4 { font-family: Verdana, sans-serif; }
  .r { display: inline-block; width: 40px; height: 20px; background: #eee; margin: 3px; }
  .btn { color: #fff; border: 0; height: 44px; padding: 0 19px; font-size: 15px; }
  .p { background: #1a4fd6; } .g { background: #0a7d32; } .alt { height: 32px; padding: 0 9px; }
  .drift div { margin: 0; } .drift div + div { margin-left: 3px; }
  .cards { display: flex; gap: 6px; } .card { background: #f3f3f3; padding: 5px; width: 220px; } .card p { margin: 0 0 10px; }
  .tight { width: 300px; line-height: 1.1; margin: 5px 0; }
  .hero { background-image: url("${stripes}"); padding: 9px; } .hero span { color: #fff; font-size: 18px; }
  .fixed { display: inline-block; width: 120px; height: 36px; overflow: hidden; white-space: nowrap; background: #333; color: #fff; line-height: 36px; }
  .panel { background: #ffffff; height: 60px; padding: 13px; }
</style></head><body data-theme="light">
<header class="w1"><h1>Tools for teams</h1><span class="badge">Summer sale</span></header>
<div class="w2 s">${[11, 12, 13, 15, 17, 19, 21, 23, 26, 29, 31, 35].map((n) => `<span style="font-size:${n}px">A${n}</span>`).join('')}
  <span style="font-weight:100">w1</span><span style="font-weight:200">w2</span><span style="font-weight:300">w3</span><span style="font-weight:800">w8</span>
  <span class="f2">Georgia</span><span class="f3">Courier</span><span class="f4">Verdana</span>
  <span style="margin-right:17px">m17</span><span style="margin-right:21px">m21</span><span style="margin-right:23px">m23</span><span style="margin-right:27px">m27</span><span style="margin-right:29px">m29</span><span class="t1">one</span><span class="t2">two</span><span class="t3">three</span></div>
<div class="w3">
  ${[3, 5, 7, 9, 11, 13].map((r, i) => `<span class="r" style="border-radius:${r}px;box-shadow:${i}px ${i + 1}px ${i * 7 + 1}px rgba(0,0,0,.${i + 2})"></span>`).join('')}
  <section class="cta"><button class="btn p">Start trial</button> <button class="btn g">Book demo</button> <button class="btn p alt">Buy now</button></section>
  <div class="drift"><div>Alpha row</div><div>Beta row</div></div><div class="drift"><div>Gamma</div><div>Delta</div></div><div class="drift"><div>Epsilon</div><div>Zeta</div></div>
  <div class="cards"><div class="card"><p>Card one text that fills the card</p><p>More text in card one</p></div><div class="card"><p>Card two text that fills the card</p><p>More text in card two</p></div><div class="card"><p>Card three text fills</p><p>More text three</p></div></div>
  <p class="tight">Body copy set with tight leading so that the lines crowd each other and slow reading across several lines.</p>
  <div class="hero"><span>White text on a pale striped image</span></div>
  <ul class="icons"><li><svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 12h16" stroke="#333" stroke-width="1" fill="none"/></svg></li><li><svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 12h16" stroke="#333" stroke-width="3" fill="none"/></svg></li></ul>
  <img src="${png}" width="200" height="200" alt="Team photo">
  <a class="fixed" href="/start">Get started</a> <a href="/docs">Docs</a> <a href="/blog">Blog</a>
  <div class="panel">Account panel</div>
</div></body></html>`;

/**
 * A page that works on a desk and falls apart in a hand: a desktop nav with no
 * menu control, three bars pinned over the content, 13px copy, a 13px field
 * that makes iOS zoom, an icon row under the target floor, and a table that
 * pushes the page sideways.
 */
const MOBILE_BAD = `<!doctype html><html lang="en"><head><title>Dashboard | Acme</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 13px; }
  .bar { position: fixed; left: 0; right: 0; background: #eef2ff; }
  .bar.top { top: 0; height: 120px; }
  .bar.promo { top: 120px; height: 90px; background: #fff3cd; }
  .bar.bottom { bottom: 0; height: 110px; background: #e8f0fe; }
  nav { display: flex; gap: 24px; white-space: nowrap; padding: 8px 12px; }
  nav a { display: inline-block; padding: 14px 10px; min-height: 44px; box-sizing: border-box; color: #1a1a1a; }
  main { padding: 220px 12px 130px; }
  p { font-size: 13px; line-height: 1.5; }
  input { font-size: 13px; padding: 12px; min-height: 44px; box-sizing: border-box; }
  .icons a { display: inline-block; width: 18px; height: 18px; background: #1a4fd6; margin-right: 2px; }
  table { width: 900px; border-collapse: collapse; }
  td { padding: 8px; border: 1px solid #ddd; }
</style></head>
<body>
  <div class="bar top"><nav aria-label="Main"><a href="/overview">Overview</a><a href="/reports">Reports</a><a href="/billing">Billing</a><a href="/team">Team</a><a href="/settings">Settings</a><a href="/help">Help</a><a href="/account">Account</a></nav></div>
  <div class="bar promo">Save 20% on annual plans this week only</div>
  <main id="main">
    <h1>Your dashboard</h1>
    <p>This paragraph is set at thirteen pixels, which reads well enough on a desk and poorly in a hand on a moving train, especially at this length.</p>
    <label for="q">Search reports</label>
    <input id="q" type="search" placeholder="Search reports">
    <p class="icons"><a href="/share" aria-label="Share"></a><a href="/print" aria-label="Print"></a><a href="/export" aria-label="Export"></a></p>
    <table><tr><td>January</td><td>February</td><td>March</td><td>April</td><td>May</td><td>June</td></tr></table>
  </main>
  <div class="bar bottom">Chat with us — we reply in minutes</div>
</body></html>`;

/** The same kinds of content, built from one set of tokens. */
const UI_GOOD = `<!doctype html><html lang="en"><head><title>Plans | Acme</title><style>
  :root { --bg: #ffffff; --fg: #1a1a1a; --muted: #555555; --primary: #1a4fd6; --surface: #f4f4f6; }
  [data-theme="dark"] { --bg: #111111; --fg: #eeeeee; --muted: #aaaaaa; --primary: #6b8cff; --surface: #1c1c1f; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 32px; }
  h1 { font-size: 48px; line-height: 1.2; margin: 0 0 16px; }
  h3 { font-size: 24px; line-height: 1.2; margin: 0 0 8px; }
  p { margin: 0 0 16px; color: var(--muted); }
  nav a { margin-right: 24px; text-decoration: none; }
  a { color: var(--primary); }
  a:hover { text-decoration: underline; } a:active { opacity: 0.8; }
  .btn { display: inline-block; height: 48px; padding: 0 24px; border-radius: 8px; font-weight: 600; line-height: 48px; border: 1px solid var(--primary); white-space: nowrap; margin-right: 16px; }
  .btn-p { background: var(--primary); color: #ffffff; } .btn-s { background: transparent; }
  .btn:hover { filter: brightness(0.9); text-decoration: none; } .btn:active { transform: translateY(1px); }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px; }
  .card { background: var(--surface); border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
</style></head><body>
<div class="wrap">
  <nav aria-label="Main"><a href="/product">Product</a><a href="/pricing">Pricing</a><a href="/docs">Docs</a></nav>
  <h1>Plans that grow with your team</h1>
  <p>Start on the free plan and move up when you need more seats, more projects or more history.</p>
  <a class="btn btn-p" href="/signup">Start free trial</a><a class="btn btn-s" href="/sales">Talk to sales</a>
  <div class="cards">
    <div class="card"><h3>Free</h3><p>Three seats and every core feature, for as long as you like.</p></div>
    <div class="card"><h3>Team</h3><p>Twenty seats, shared projects and a year of history.</p></div>
    <div class="card"><h3>Business</h3><p>Unlimited seats, single sign-on and audit logs.</p></div>
  </div>
</div></body></html>`;

/** A listing whose file names are cut off with nothing to recover them. */
const UI_TRUNC = `<!doctype html><html lang="en"><head><title>Files | Acme</title><style>
  body { font-family: Arial; margin: 24px; } .name { display: block; width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style></head><body><main><h1>Files</h1><ul>
  <li><span class="name">invoice-2024-03-quarterly-final.pdf</span></li><li><span class="name">invoice-2024-03-quarterly-draft.pdf</span></li>
  <li><span class="name" title="invoice-2024-04-quarterly-final.pdf">invoice-2024-04-quarterly-final.pdf</span></li>
</ul></main></body></html>`;

/* ---------------------------------------------------------------- runner */

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

/**
 * Measures a fixture. With `url`, the page is served at that address through a
 * route, so it has a real location (and init scripts run); otherwise it is set
 * as content on about:blank.
 */
async function run(name: string, html: string, { type = 'landing', url }: { type?: PageType; url?: string } = {}) {
  const m = await measurePage(async (page) => {
    if (url) {
      await page.route('https://fixture.test/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
      await page.goto(url, { waitUntil: 'load' });
    } else {
      await page.setContent(html, { waitUntil: 'load' });
    }
    return 200;
  });
  if (!m) throw new Error('no browser could be launched');
  for (const k of ['facts', 'axe', 'keyboard', 'reduce', 'ux', 'forms', 'toasts'] as const) {
    const s = m[k];
    check(`${name}: ${k} step ran`, s.ok, s.ok ? `${s.ms}ms` : s.error);
  }
  const doc = docFacts(parseHtml(m.html, url ?? 'https://fixture.test/')!, url ?? 'https://fixture.test/', 200);
  const pageType: PageTypeResult = { type, confidence: 0.9, source: 'signals', signals: ['fixture'] };
  const ev = evaluate({ measured: m, noBrowser: null, doc, pageType, platforms: ['web', 'webapp'] });
  return { m, ev, scored: score(ev.criteria, ev.findings, goalOf('health')) };
}

const goalOf = (id: GoalId) => GOALS.find((g) => g.id === id)!;
/** One check's outcome, by the engine's internal measurement id. */
const status = (ev: Evaluation, id: string) => ev.checks.find((c) => c.id === id)!;
/** One criterion's verdict. */
const verdict = (ev: Evaluation, id: string) => ev.criteria.find((c) => c.id === id)!;
const says = (o: { status: string; note: string | null }) => `${o.status}: ${o.note ?? ''}`.slice(0, 180);
const firing = (fs: ContractFinding[], id: string) => fs.filter((f) => f.ruleId === id);

async function main() {
  console.log('\nBAD fixture');
  const bad = await run('BAD', BAD);
  const expectFail = [
    'ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'ACC-005', 'ACC-007', 'ACC-008', 'ACC-009', 'ACC-010',
    'ACC-011', 'ACC-012', 'ACC-013', 'ACC-014', 'ACC-015', 'ACC-016', 'ACC-017', 'ACC-021', 'ACC-022',
    'ACC-023', 'ACC-024',
  ];
  for (const id of expectFail) {
    const o = status(bad.ev, id);
    check(`${id} fails`, o.status === 'fail', says(o));
  }
  const acc005 = firing(bad.ev.findings, 'ACC-005');
  check('ACC-005 is one finding for one root cause', acc005.length === 1, `${acc005.length} finding(s), ${acc005[0]?.evidence.length ?? 0} instance(s)`);
  check('ACC-020 reports no trap', status(bad.ev, 'ACC-020').status === 'pass');
  check('ACC-019 measured a pass (a slow spin is not a flash)', ['pass'].includes(status(bad.ev, 'ACC-019').status), says(status(bad.ev, 'ACC-019')));
  const everyEvidence = bad.ev.findings.flatMap((f) => f.evidence);
  check(
    'every finding carries the five contract evidence fields',
    everyEvidence.every((e) => e.evidenceId && e.selector && e.screenshotRef && e.bbox.length === 4 && e.observed && e.expected),
  );
  check(
    'no evidence box leaves the first screen',
    everyEvidence.every((e) => e.bbox[0] >= 0 && e.bbox[1] >= 0 && e.bbox[0] + e.bbox[2] <= 1441 && e.bbox[1] + e.bbox[3] <= 901),
  );
  const acc = bad.scored.pillars.find((p) => p.id === 'accessibility')!;
  check('the accessibility pillar scores a pass rate', acc.score != null && acc.score >= 0 && acc.score < 100, `${acc.score} — ${acc.counts.pass} pass, ${acc.counts.fail} fail`);
  check('the overall score stays within 0–100', (bad.scored.overall ?? 0) >= 0 && (bad.scored.overall ?? 0) <= 100, `overall ${bad.scored.overall}`);
  check('priorities are ranked, worst first', bad.scored.priorities.every((x, i, a) => i === 0 || a[i - 1].rank >= x.rank), bad.scored.priorities.map((x) => `${x.criterionId}=${x.rank}`).join(' '));
  check('at most five priorities are listed', bad.scored.priorities.length <= 5, `${bad.scored.priorities.length}`);
  const contrast = firing(bad.ev.findings, 'ACC-001')[0];
  check('ACC-001 fix names a replacement colour', !!contrast && /#[0-9A-F]{6}/.test(contrast.fix) && !contrast.fix.includes('{suggested_hex}'), contrast?.fix.split('\n')[0]);

  console.log('\nGOOD fixture');
  const good = await run('GOOD', GOOD);
  const design = (id: string) => /^(ACC|UX|UI)-/.test(id);
  const confirmed = good.ev.findings.filter((f) => f.status === 'confirmed' && design(f.ruleId));
  check('no confirmed findings from the design measurements', confirmed.length === 0, confirmed.map((f) => `${f.ruleId}: ${f.evidence[0].observed}`).join(' | '));
  for (const o of good.ev.checks) {
    if (o.status === 'fail' && design(o.id)) check(`${o.id} does not fail`, false, says(o));
  }
  const goodAcc = good.scored.pillars.find((p) => p.id === 'accessibility')!;
  check('the accessibility pillar scores 100 on the good page', goodAcc.score === 100, `${goodAcc.score}`);
  check('at least 3 evidenced passes for "what is working"', good.ev.passes.length >= 3, `${good.ev.passes.length} passes`);
  check('ACC-017 passes: motion stops under reduced motion', status(good.ev, 'ACC-017').status === 'pass', says(status(good.ev, 'ACC-017')));
  check('ACC-021 is not applicable: <main> present', status(good.ev, 'ACC-021').status === 'not_applicable');

  console.log('\nbrowser defaults (regressions from live audits)');
  const DEFAULTS = `<!doctype html><html lang="en"><head><title>Contact the Acme team</title>
  <style>body { background: #0d0d0d; color: #f2f2f2; font-family: Arial; margin: 24px; } a { color: #f2f2f2; display: inline-block; padding: 14px 16px; }</style></head>
  <body><main><h1>Talk to us</h1><a href="/one">First link</a><a href="/two">Second link</a>
  <iframe title="Booking widget" width="400" height="120" srcdoc="<a href='#a'>Inside one</a> <a href='#b'>Inside two</a>"></iframe>
  <a href="/three">After the frame</a></main></body></html>`;
  const defaults = await run('DEFAULTS', DEFAULTS);
  check('the browser’s own two-tone focus ring on a dark page is not a contrast failure', status(defaults.ev, 'ACC-006').status !== 'fail', says(status(defaults.ev, 'ACC-006')));
  check('Tab moving through an iframe is not a keyboard trap', status(defaults.ev, 'ACC-020').status === 'pass', says(status(defaults.ev, 'ACC-020')));

  console.log('\nUX: landing page');
  const outcome = says;
  const expect = (ev: Evaluation, id: string, want: RuleOutcome['status'], label = '') => {
    const o = status(ev, id);
    check(`${id} ${want}${label ? ` — ${label}` : ''}`, o.status === want, says(o));
  };
  const land = await run('UX_LANDING', UX_LANDING, { url: 'https://fixture.test/features' });
  expect(land.ev, 'UX-001', 'fail', 'two equal filled buttons to different places');
  expect(land.ev, 'UX-002', 'pass');
  expect(land.ev, 'UX-011', 'pass', 'a call to action that is not an account wall');
  expect(land.ev, 'UX-014', 'fail', 'placeholders as the only visible labels');
  expect(land.ev, 'UX-015', 'fail', 'Features is current but unmarked');
  expect(land.ev, 'UX-020', 'fail', 'a 16-word toast gone in 1.2s');
  expect(land.ev, 'UX-022', 'fail', 'a paragraph over 6 lines');
  expect(land.ev, 'UX-023', 'fail', 'over 90 characters per line');
  expect(land.ev, 'UX-025', 'fail', 'a menu shown only on hover');
  expect(land.ev, 'UX-026', 'not_applicable');
  expect(land.ev, 'UX-003', 'not_evaluated', 'the audit does not press controls');
  const ux001 = firing(land.ev.findings, 'UX-001')[0];
  check('UX-001 carries two independent signals', (ux001?.evidence.length ?? 0) > 0 && !land.ev.discarded.some((d) => d.ruleId === 'UX-001'));
  check('a hover menu inside the nav goes to review, not the score', firing(land.ev.findings, 'UX-025').every((f) => f.status === 'needs_human_review'));
  check('every finding names the criterion it fails and the standard behind it', land.ev.findings.every((f) => f.criterionId && f.standard && f.passCondition));

  console.log('\nUX: onboarding step with a bad form');
  const form = await run('UX_FORM', UX_FORM, { type: 'onboarding', url: 'https://fixture.test/onboarding/profile' });
  expect(form.ev, 'UX-004', 'fail', '"Invalid email" gives no correction');
  expect(form.ev, 'UX-005', 'fail', 'errors only when validated');
  expect(form.ev, 'UX-006', 'not_applicable', 'fewer than 6 fields');
  expect(form.ev, 'UX-008', 'fail', 'step 2 of 4 with no way back');
  expect(form.ev, 'UX-009', 'pass', 'the step counter');
  expect(form.ev, 'UX-012', 'fail', 'phone and company required to create an account');
  expect(form.ev, 'UX-013', 'fail', 'required and optional unmarked');
  expect(form.ev, 'UX-021', 'fail', '"Submit" on a paid plan');
  const held = holdAssisted(form.ev, false);
  check(
    'without a model review, criteria judged by reading are held for a person',
    held.findings.filter((f) => ['UX-004', 'UX-012', 'UX-021'].includes(f.ruleId)).every((f) => f.status === 'needs_human_review'),
  );
  check('a measured criterion is not held', held.findings.filter((f) => f.ruleId === 'UX-013').every((f) => f.status === 'confirmed'));
  check('a held criterion reports "not assessed" rather than a failure', verdict(held, 'CN-02').verdict === 'not_assessed', verdict(held, 'CN-02').note);
  check('with a model review, those findings stand', holdAssisted(form.ev, true) === form.ev);
  check('nothing was submitted: the page never left its address', form.m.finalUrl === 'https://fixture.test/onboarding/profile', form.m.finalUrl);

  console.log('\nUX: the same step, done right');
  const formGood = await run('UX_FORM_GOOD', UX_FORM_GOOD, { type: 'onboarding', url: 'https://fixture.test/onboarding/profile' });
  for (const id of ['UX-004', 'UX-005', 'UX-008', 'UX-009', 'UX-012', 'UX-013']) expect(formGood.ev, id, 'pass');
  expect(formGood.ev, 'UX-021', 'not_applicable', 'no generic label');
  for (const o of formGood.ev.checks) if (o.status === 'fail' && o.id.startsWith('UX')) check(`${o.id} does not fail`, false, says(o));

  console.log('\nUX: listing');
  const list = await run('UX_LIST', UX_LIST, { type: 'listing', url: 'https://fixture.test/catalogue' });
  expect(list.ev, 'UX-017', 'fail', '30 unsorted items, no search');
  expect(list.ev, 'UX-010', 'fail', 'an empty panel with no action');
  const sorted = await run('UX_LIST sorted', UX_LIST.replace(/<ul class="items">[\s\S]*?<\/ul>/, `<ul class="items">${[...FRUIT].sort().map((f) => `<li class="item">${f} crate</li>`).join('')}</ul>`), { type: 'listing', url: 'https://fixture.test/catalogue' });
  check('an alphabetical list does not need search', status(sorted.ev, 'UX-017').status !== 'fail', outcome(status(sorted.ev, 'UX-017')));

  console.log('\nUX: modals');
  const trapped = await run('MODAL', MODAL());
  expect(trapped.ev, 'UX-026', 'fail', 'no close, Escape or backdrop');
  const closable = await run('MODAL close', MODAL('<button aria-label="Close">×</button>'));
  expect(closable.ev, 'UX-026', 'pass', 'a close button');
  const escapable = await run('MODAL escape', MODAL('<script>document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelector(".overlay").remove(); });</script>'));
  expect(escapable.ev, 'UX-026', 'pass', 'Escape closes it');

  console.log('\nUX: regressions from live audits');
  const SWAP = `<!doctype html><html lang="en"><head><title>Studio | Acme</title><style>
    .btn { display: inline-block; padding: 14px 24px; background: #111; color: #fff; text-decoration: none; }
    .btn .hover-text { display: none; } .btn:hover .hover-text { display: inline; } .btn:hover .rest-text { display: none; }
  </style></head><body><main><h1>Studio</h1><a class="btn" href="/call"><span class="rest-text">Schedule a call</span><span class="hover-text">Let's talk</span></a></main></body></html>`;
  const swap = await run('SWAP', SWAP);
  check('a button animating its own label on hover is not hidden content', status(swap.ev, 'UX-025').status !== 'fail', outcome(status(swap.ev, 'UX-025')));
  const loginDoc = `<html><head><title>Sign in to Acme · Acme</title></head><body><form><input type="hidden" name="t"><label>Username or email<input name="login"></label><label>Password<input type="password"></label><input type="checkbox" name="remember"><input type="checkbox" name="trust"><input name="webauthn-support"><button>Sign in</button></form></body></html>`;
  const lt = classifyBySignals(docFacts(parseHtml(loginDoc, 'https://acme.test/login')!, 'https://acme.test/login', 200));
  check('a login page with a few extra inputs classifies as login', lt.type === 'login', `${lt.type} ${lt.confidence} — ${lt.signals.join('; ')}`);
  const demoRoot = GOOD.replace('<form>', '<form><label for="cc">Card number</label><input id="cc" name="cardnumber" autocomplete="cc-number">').replace('<h2>Compare plans</h2>', '<h2>Compare plans</h2><h2>Payments</h2><h2>Billing</h2><h2>Connect</h2>');
  const rt = classifyBySignals(docFacts(parseHtml(demoRoot, 'https://acme.test/')!, 'https://acme.test/', 200));
  check('a card-form demo on the site root is not a checkout', rt.type !== 'checkout', `${rt.type} ${rt.confidence} — ${rt.signals.join('; ')}`);

  console.log('\nUI: a page with no system');
  const png = `data:image/png;base64,${(await sharp({ create: { width: 200, height: 100, channels: 3, background: '#c33' } }).png().toBuffer()).toString('base64')}`;
  const uiBad = await run('UI_BAD', UI_BAD(png), { url: 'https://fixture.test/tools' });
  for (const k of ['ui', 'imageText', 'states', 'dark', 'stress'] as const) {
    const s = uiBad.m[k];
    check(`UI_BAD: ${k} step ran`, s.ok, s.ok ? `${s.ms}ms` : s.error);
  }
  const uiFail: [string, string][] = [
    ['UI-001', 'more than 12 font sizes'], ['UI-002', 'more than 4 weights'], ['UI-003', 'four typefaces'],
    ['UI-004', 'spacing off any scale'], ['UI-006', 'three text greys a hair apart'], ['UI-007', 'six corner radii'],
    ['UI-008', 'six unrelated shadows'], ['UI-009', 'a blue and a green primary side by side'], ['UI-010', 'one button at two sizes'],
    ['UI-011', 'three groups 3px off their edge'], ['UI-012', 'three container widths'], ['UI-013', 'cards 6px apart'],
    ['UI-014', 'body text at 1.1 leading'], ['UI-015', 'white text on a pale image'], ['UI-016', 'icons at 1px and 3px strokes'],
    ['UI-017', 'a 2:1 photo drawn square'], ['UI-018', 'no hover or press states'], ['UI-020', 'a fixed-width label that clips'],
    ['UI-021', 'a white panel left in dark mode'],
  ];
  for (const [id, why] of uiFail) expect(uiBad.ev, id, 'fail', why);
  const ui022 = status(uiBad.ev, 'UI-022');
  check('UI-022 fails — a sale badge outweighs the headline (held for review: L3)', ui022.status === 'fail', outcome(ui022));
  const stressEv = firing(uiBad.ev.findings, 'UI-020')[0]?.evidence[0];
  check('UI-020 keeps a capture of the broken layout', typeof stressEv?.fields.stress_test_screenshot === 'string' && String(stressEv.fields.stress_test_screenshot).startsWith('data:image/'));
  check('the page was put back: stress text restored', !uiBad.m.html.includes('Get started Get started'));

  console.log('\nUI: a page built from tokens');
  const uiGood = await run('UI_GOOD', UI_GOOD, { url: 'https://fixture.test/plans' });
  for (const o of uiGood.ev.checks.filter((x) => x.id.startsWith('UI'))) {
    check(`${o.id} does not fail`, o.status !== 'fail', says(o));
  }
  for (const id of ['UI-001', 'UI-002', 'UI-003', 'UI-004', 'UI-007', 'UI-008', 'UI-009', 'UI-014', 'UI-018', 'UI-021', 'UI-022']) expect(uiGood.ev, id, 'pass');

  console.log('\nUI: listing');
  const trunc = await run('UI_TRUNC', UI_TRUNC, { type: 'listing', url: 'https://fixture.test/files' });
  const t19 = status(trunc.ev, 'UI-019');
  check('UI-019 fails for the two names with no title, not the one with', t19.status === 'fail' && firing(trunc.ev.findings, 'UI-019')[0]?.evidence.length === 2, says(t19));

  console.log('\nUI: regressions from live audits');
  const MOUSEDOWN = `<!doctype html><html lang="en"><head><title>Instant | Acme</title><style>a { padding: 8px; display: inline-block; } a:hover { background: #eee; } a:active { background: #ddd; }</style></head>
  <body><main><h1>Instant navigation</h1><a href="/one" onmousedown="location.href='https://fixture.test/elsewhere'">One</a> <a href="/two" onmousedown="location.href='https://fixture.test/elsewhere'">Two</a> <a href="/three">Three</a></main></body></html>`;
  const md = await run('MOUSEDOWN', MOUSEDOWN, { url: 'https://fixture.test/instant' });
  check('the state probe never presses: a site that navigates on mousedown stays put', md.m.finalUrl === 'https://fixture.test/instant', md.m.finalUrl);
  check('…and its :active styles are still read', status(md.ev, 'UI-018').status === 'pass', outcome(status(md.ev, 'UI-018')));

  console.log('\nUI: preflight and colour maths');
  check('ΔE between #1A1A1A and #1C1C1C is under 3', deltaE([26, 26, 26], [28, 28, 28]) < 3, deltaE([26, 26, 26], [28, 28, 28]).toFixed(2));
  check('ΔE between black and white is about 100', Math.abs(deltaE([0, 0, 0], [255, 255, 255]) - 100) < 1, deltaE([0, 0, 0], [255, 255, 255]).toFixed(1));

  console.log('\nMOBILE: a page that works on a desk and not in a hand');
  const mob = await run('MOBILE_BAD', MOBILE_BAD, { type: 'dashboard', url: 'https://fixture.test/dashboard' });
  check('the phone visit ran', mob.m.mobile.ok, mob.m.mobile.ok ? `${mob.m.mobile.value.viewport.width}×${mob.m.mobile.value.viewport.height}` : mob.m.mobile.error);
  check('the phone visit is a second context, not the desktop page resized', mob.m.mobile.ok && mob.m.mobile.value.facts.viewport.width === 390);
  for (const id of ['MOB-001', 'MOB-003', 'MOB-004', 'MOB-005', 'MOB-006', 'MOB-007']) expect(mob.ev, id, 'fail');
  const navFinding = firing(mob.ev.findings, 'MOB-003')[0];
  check('MOB-003 says how many links it counted', typeof navFinding?.evidence[0].fields.visible_links === 'number', String(navFinding?.evidence[0].fields.visible_links));
  check('a mobile finding carries the phone capture', typeof navFinding?.evidence[0].fields.mobile_capture === 'string' && String(navFinding.evidence[0].fields.mobile_capture).startsWith('data:image/'));
  check('mobile findings are document-level, not boxed on the desktop shot', mob.ev.findings.filter((f) => f.ruleId.startsWith('MOB')).every((f) => f.evidence.every((e) => e.documentLevel)));
  const barShare = firing(mob.ev.findings, 'MOB-004')[0]?.evidence[0].fields.covered_share;
  check('MOB-004 reports the share of the screen covered', typeof barShare === 'string' && /%$/.test(String(barShare)), String(barShare));

  console.log('\nMOBILE: the good page holds up in a hand');
  for (const id of ['MOB-001', 'MOB-004', 'MOB-005', 'MOB-006', 'MOB-007']) {
    const o = status(good.ev, id);
    check(`GOOD: ${id} does not fail`, o.status !== 'fail', says(o));
  }
  check('GOOD: a nav of five links with no menu control still passes', status(good.ev, 'MOB-003').status === 'pass', says(status(good.ev, 'MOB-003')));

  console.log('\nUX: pages that do it right');
  for (const o of good.ev.checks) if (o.status === 'fail' && o.id.startsWith('UX')) check(`GOOD: ${o.id} does not fail`, false, says(o));
  check('GOOD has no UX failures', !good.ev.checks.some((o) => o.status === 'fail' && o.id.startsWith('UX')));

  console.log('\nnot_evaluated, never pass');
  const blind = evaluate({ measured: null, noBrowser: 'no browser in this test', doc: good.ev ? docFacts(parseHtml(GOOD, 'https://fixture.test/')!, 'https://fixture.test/', 200) : null, pageType: { type: 'unknown', confidence: 0, source: 'none', signals: [] }, platforms: ['web'] });
  const layout = ['ACC-001', 'ACC-003', 'ACC-005', 'ACC-007', 'ACC-012', 'ACC-020', 'UX-003', 'UX-014', 'UX-015', 'UX-020', 'UX-025', 'UX-026', 'UI-001', 'UI-005', 'UI-015', 'UI-018', 'UI-020', 'UI-021'];
  for (const id of layout) {
    check(`${id} without a browser is not_evaluated`, status(blind, id).status === 'not_evaluated');
  }
  check('document rules still run without a browser', ['ACC-014', 'ACC-015', 'ACC-023', 'ACC-024'].every((id) => status(blind, id).status === 'pass'));

  console.log('\npage type');
  const pathOnly = classifyBySignals(docFacts(parseHtml(GOOD, 'https://acme.test/pricing')!, 'https://acme.test/pricing', 200));
  check('a URL alone is not enough: /pricing with no prices stays unknown', pathOnly.type === 'unknown', `${pathOnly.type} ${pathOnly.confidence}`);
  const PRICED = GOOD.replace(
    '<div class="card">',
    '<div class="plan"><h3>Free</h3><p>$0 / month</p></div><div class="plan"><h3>Team</h3><p>$12 per month per seat</p></div><div class="card">',
  );
  const pt = classifyBySignals(docFacts(parseHtml(PRICED, 'https://acme.test/pricing')!, 'https://acme.test/pricing', 200));
  check('a /pricing page with plan cards classifies as pricing', pt.type === 'pricing', `${pt.type} ${pt.confidence} — ${pt.signals.join('; ')}`);
  const vague = classifyBySignals(docFacts(parseHtml('<html><body><p>hi</p></body></html>', 'https://x.test/a/b')!, 'https://x.test/a/b', 200));
  check('a page with no signals is unknown', vague.type === 'unknown', `${vague.type} ${vague.confidence}`);

  console.log('\nthe framework');
  check('every criterion names checks that exist', MISSING_CHECKS.length === 0, MISSING_CHECKS.join(', '));
  check('every measurement feeds a criterion', ORPHAN_CHECKS.length === 0, ORPHAN_CHECKS.join(', '));
  const landCriteria = land.ev.criteria;
  check('criteria carry a verdict from the measurements under them', landCriteria.every((c) => ['pass', 'partial', 'fail', 'not_applicable', 'not_assessed'].includes(c.verdict)));
  check('a criterion with no measurement is never a pass', landCriteria.filter((c) => !c.checks.length).every((c) => c.verdict === 'not_assessed'));
  const weighted = score(land.ev.criteria, land.ev.findings, goalOf('accessible'));
  const flat = score(land.ev.criteria, land.ev.findings, goalOf('health'));
  check('the goal changes the weights, not the criteria', weighted.pillars.length === flat.pillars.length && weighted.pillars.find((p) => p.id === 'accessibility')!.weight === 2, `accessibility weight ${weighted.pillars.find((p) => p.id === 'accessibility')!.weight}`);
  const conv = score(land.ev.criteria, land.ev.findings, goalOf('conversion'));
  check('an optional pillar is off until a goal switches it on', !flat.pillars.some((p) => p.id === 'conversion') && conv.pillars.some((p) => p.id === 'conversion'));
  check('a pillar score is the share of its judged criteria that passed', flat.pillars.every((p) => p.score === null || (p.score >= 0 && p.score <= 100)));

  console.log('\nL3 validators');
  const f = firing(bad.ev.findings, 'ACC-001')[0];
  const nums = new Set(['4.5', '2.32']);
  check('banned phrase rejected', !!proseProblem('Consider optimizing the colours to enhance the user experience.', nums));
  check('heuristic jargon rejected in rationale', !!proseProblem('This violates Nielsen heuristic 5.', nums, { rationale: true }));
  check('invented number rejected', !!proseProblem('Contrast failures cost sites 23% of conversions.', nums));
  check('evidence number allowed', proseProblem('Readers struggle at 2.32:1; the minimum is 4.5:1.', nums) === null);
  check('vague fix rejected', !!fixProblem('Make the text easier to read.', f));
  check('specific fix accepted', fixProblem(`Set the paragraph ${f.evidence[0].selector} color to #6B6B6B.`, f) === null, fixProblem(`Set the paragraph ${f.evidence[0].selector} color to #6B6B6B.`, f) ?? '');

  const reply: ReviewReply = {
    findings: [
      { id: f.id, false_positive: false, false_positive_reason: '', confidence: 0.99, confidence_reason: '', severity: 'low', severity_reason: 'minor', rationale: 'Best practices suggest more contrast.', fix: 'Improve it.' },
    ],
    merges: [{ ids: [f.id, firing(bad.ev.findings, 'ACC-004')[0].id] }],
    summary: 'The page loses 40% of users to contrast.',
    what_is_working: [{ evidence_id: 'EV-NOPE', text: 'Everything is great.' }],
  };
  const applied = applyReview(reply, bad.ev, bad.ev.findings);
  const after = applied.findings.find((x) => x.id === f.id)!;
  check('model cannot raise confidence', after.confidence === f.confidence, `${after.confidence}`);
  check('model cannot move severity two steps (high → low)', after.severity === f.severity, after.severity);
  check('banned-phrase rationale kept the catalog text', after.rationale === f.rationale);
  check('vague fix kept the catalog fix', after.fix === f.fix);
  check('cross-rule merge refused', applied.findings.length === bad.ev.findings.length);
  check('summary with an invented number dropped', applied.summary === null);
  check('what-is-working pointing at no pass refused', applied.working === null);
  check('model cannot add a finding', applied.findings.every((x) => bad.ev.findings.some((y) => y.id === x.id)));
  console.log(`\n  rejected edits: ${applied.rejected.length}`);

  const fp = applyReview(
    { findings: [{ id: f.id, false_positive: true, false_positive_reason: 'the text is a disabled label', confidence: f.confidence, confidence_reason: '', severity: f.severity, severity_reason: '', rationale: f.rationale, fix: f.fix }], merges: [], summary: '', what_is_working: [] },
    bad.ev,
    bad.ev.findings,
  ).findings.find((x) => x.id === f.id)!;
  check('a false positive moves to review, not deleted', fp.status === 'needs_human_review', fp.reviewReason ?? '');

  console.log('\nEXPERT: the auditor pass may create findings, but only anchored ones');
  const anchor = (id: string, kind: Anchor['kind'], text: string, selector: string, y = 100): Anchor => ({ id, kind, text, selector, box: { x: 40, y, w: 200, h: 48 } });
  const anchors = new Map<string, Anchor>(
    [
      anchor('d1', 'cta', 'Try it out', 'main > a:nth-of-type(1)'),
      anchor('d2', 'cta', 'Join waitlist', 'main > a:nth-of-type(2)'),
      anchor('d3', 'heading', 'Plan & book your entire event', 'h1'),
      anchor('d4', 'pinned', 'We use cookies', '#cookie'),
      anchor('m1', 'cta', 'Join waitlist', 'main > a:nth-of-type(2)', 600),
      anchor('m2', 'section', 'Who we are', 'section:nth-of-type(2)', 900),
    ].map((a) => [a.id, a]),
  );
  const base = { area: 'Calls to action', device: 'desktop' as const, confidence: 0.85 };
  const sound = {
    ...base,
    title: 'Conflicting CTAs & unclear primary action',
    bucket: 'fix' as const,
    issue: '“Try it out” and “Join waitlist” sit side by side at the same size and weight.',
    impact: 'Visitors hesitate between two paths and more of them choose neither.',
    solution: 'Make “Join waitlist” the single filled button; turn “Try it out” into a text link and add “No credit card · 30s” under it.',
    element_ids: ['d1', 'd2'],
  };
  const ex: ExpertReply = {
    page_goal: 'Get event planners to join the waitlist.',
    summary: 'The hero splits attention and the cookie banner competes with it.',
    takeaways: { good: ['Clear headline'], improve: ['Card hierarchy'], fix: ['Two equal CTAs', 'Consider optimizing everything'], ideas: ['a', 'b', 'c', 'd', 'e'] },
    findings: [
      sound,
      { ...base, title: 'Phantom element', bucket: 'fix', issue: 'Something is wrong.', impact: 'It hurts.', solution: 'Change the thing with exact copy.', element_ids: ['d999'] },
      { ...base, title: 'Vague advice', bucket: 'improve', issue: 'The hero is busy.', impact: 'Visitors are distracted.', solution: 'Consider optimizing the hero.', element_ids: ['d3'] },
      { ...base, title: 'Low confidence hunch', bucket: 'idea', issue: 'Maybe the banner is wrong.', impact: 'Possibly bounce.', solution: 'Move the banner to the bottom with a neutral style.', element_ids: ['d4'], confidence: 0.3 },
      { ...base, title: 'Hero headline too small on phone', bucket: 'improve', device: 'desktop', issue: 'The waitlist button is pushed below the first phone screen.', impact: 'Mobile visitors scroll before they can act.', solution: 'Make the hero 80vh on phones and keep “Join waitlist” above the fold.', element_ids: ['m1', 'm2', 'd3'] },
    ],
  };
  const measuredSame = [{ checkName: 'Unclear primary action', evidence: [{ selector: 'main > a:nth-of-type(2)' }] }] as unknown as Parameters<typeof acceptExpertReply>[2];
  const out = acceptExpertReply(ex, anchors, []);
  check('a finding citing real elements is kept', out.accepted.some((a) => a.title === sound.title && a.anchors.length === 2));
  check('a finding citing nothing on the page is dropped', !out.accepted.some((a) => a.title === 'Phantom element') && out.rejected.some((r) => /cites nothing/.test(r)));
  check('vague advice is dropped', !out.accepted.some((a) => a.title === 'Vague advice'));
  check('a low-confidence finding is dropped', !out.accepted.some((a) => a.title === 'Low confidence hunch'));
  const phone = out.accepted.find((a) => a.title.startsWith('Hero headline'));
  check('a finding mostly on the phone is filed under mobile', phone?.note.device === 'mobile' && phone.anchors.every((a) => a.id.startsWith('m')), phone?.note.device);
  check('a fix leads the list', out.accepted[0]?.note.bucket === 'fix');
  check('takeaways drop vague lines and cap at four', !out.takeaways.fix.some((x) => /optimizing/i.test(x)) && out.takeaways.ideas.length === 4);
  check('the page goal is kept', out.pageGoal === 'Get event planners to join the waitlist.');
  const dup = acceptExpertReply({ ...ex, findings: [{ ...sound, title: 'Unclear primary action between two buttons' }] }, anchors, measuredSame);
  check('a measured finding about the same element and topic wins', dup.accepted.length === 0 && dup.rejected.some((r) => /already reported/.test(r)));
  const many = acceptExpertReply(
    { ...ex, findings: Array.from({ length: 14 }, (_, i) => ({ ...sound, title: `Finding ${i + 1}` })) },
    anchors,
    [],
  );
  check('no more than ten expert findings', many.accepted.length === 10, String(many.accepted.length));

  console.log(`\n${failures ? `${failures} check(s) failed` : 'all checks passed'}\n`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
