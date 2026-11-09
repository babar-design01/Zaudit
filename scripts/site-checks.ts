/**
 * Site checks: `npm run test:site`. Exits non-zero on the first failure list.
 *
 * 1. No placeholder `#` link in the nav or footer, and every link they hold
 *    points at a page that exists in src/app.
 * 2. `?plan=` on /contact chooses the right plan, and ignores anything else.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLAN_CHOICES, paidPlan, planFromParam, planMessage, planRequestHref } from '../src/lib/plan-request';
import { PLANS } from '../src/lib/plans';

const failures: string[] = [];
const check = (ok: boolean, what: string) => {
  if (!ok) failures.push(what);
};

/* ------------------------------------------------- 1. nav and footer links */

const APP = join(__dirname, '..', 'src', 'app');
const SOURCES = ['src/components/site/SiteNav.tsx', 'src/components/site/SiteFooter.tsx'];

for (const file of SOURCES) {
  const src = readFileSync(join(__dirname, '..', file), 'utf8');
  // href: '#', href="#", href={'#'} — the shapes a placeholder link takes.
  check(!/href\s*[:=]\s*\{?\s*['"`]#['"`]/.test(src), `${file} has a placeholder href="#"`);

  for (const [, href] of src.matchAll(/href:\s*'([^']+)'/g)) {
    if (/^https?:/.test(href)) continue;
    const path = href.split(/[?#]/)[0];
    const page = path === '/' ? join(APP, 'page.tsx') : join(APP, ...path.split('/').filter(Boolean), 'page.tsx');
    // /report/sample is served by the dynamic /report/[id] route.
    const dynamic = path.startsWith('/report/') && existsSync(join(APP, 'report', '[id]', 'page.tsx'));
    check(existsSync(page) || dynamic, `${file} links to ${href}, which has no page`);
  }
}

/* --------------------------------------------------------- 2. ?plan= on /contact */

check(planFromParam('starter') === 'starter', '?plan=starter should choose Starter');
check(planFromParam('pro') === 'pro', '?plan=pro should choose Pro');
check(planFromParam('agency') === 'agency', '?plan=agency should choose Agency');
check(planFromParam('PRO') === 'pro', '?plan=PRO should choose Pro (case does not matter)');
check(planFromParam('unsure') === 'unsure', '?plan=unsure should choose Not sure yet');
for (const bad of ['xyz', '', ' ', 'max', 'enterprise', undefined, null, ['pro', 'agency'], 3]) {
  check(planFromParam(bad) === null, `?plan=${JSON.stringify(bad)} should choose nothing`);
}

// Every pricing card's button opens /contact with a plan the form recognises.
for (const plan of PLANS) {
  const href = planRequestHref(plan);
  const param = new URL(href, 'https://x.test').searchParams.get('plan');
  check(href.startsWith('/contact?plan='), `${plan.name}'s button should open /contact, got ${href}`);
  check(paidPlan(planFromParam(param))?.id === plan.id, `${href} should preselect ${plan.name}`);
  check(planMessage(planFromParam(param)) === `Hi, I'd like to start the ${plan.name} plan.`, `${href} should prefill the message`);
}
check(planMessage('unsure') === '' && planMessage(null) === '', 'No plan, or Not sure yet, should leave the message empty');
check(PLAN_CHOICES.map((c) => c.label).join(',') === 'Starter,Pro,Agency,Not sure yet', `Plan field options are ${PLAN_CHOICES.map((c) => c.label).join(', ')}`);

/* ------------------------------------------------------------------ result */

if (failures.length) {
  console.error(`✗ ${failures.length} site check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('✓ site checks passed: nav and footer links are real pages; ?plan= chooses the right plan and ignores the rest.');
