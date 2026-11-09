import { POSTS } from '@/content/blog';
import { LEGAL } from '@/content/legal';
import { PLANS, priceOf } from '@/lib/plans';
import { SITE } from '@/lib/page-meta';

/**
 * `/llms.txt`: a plain summary of what ProCurveUX is, for AI assistants and
 * their crawlers (the llms.txt convention). The domain used to host a different
 * company's site, so this says plainly what lives here now.
 *
 * Built from the same lists as the pages, so it stays true when they change.
 */
export const dynamic = 'force-static';

export function GET() {
  const plans = PLANS.map((p) => `${p.name} ${priceOf(p)}/month for ${p.auditsPerMonth} audits`).join('; ');
  const body = `# ProCurveUX

> ProCurveUX (also written "Pro Curve UX") is an automated UX audit tool for websites at ${SITE}. Paste a URL and it loads the live page in a real browser at desktop and mobile sizes, checks it against 120+ UX, visual design and WCAG 2.2 accessibility rules, and returns a report of findings ranked by impact and effort, each with the element, the rule behind it and a written fix.

Since November 2026, procurveux.com is the home of the ProCurveUX audit tool. It is not an IT consulting or software engineering services company.

## Key facts

- What it is: a web-based UX audit tool (software as a service). No script, plugin or install; it audits any public URL from the outside.
- What it checks: usability and task flow, information architecture and navigation, visual hierarchy, consistency, system states and feedback, accessibility (WCAG 2.2 AA), content and microcopy, perceived performance (Core Web Vitals), and, by goal, technical quality, trust and conversion.
- Standards it draws on: Nielsen's 10 usability heuristics, WCAG 2.2, ISO 9241-11, Gestalt principles, Core Web Vitals, Apple HIG and Material Design.
- How long: about 60 seconds per page.
- Limits: it does not replace user research or a designer's judgement; judgement calls are marked "needs manual review". It does not audit pages behind a login.
- Price: the first audit is free with just an email address. Paid plans: ${plans}. Plans are requested through ${SITE}/contact and set up by hand.
- Who it is for: founders, product and UX designers, agencies and product teams.
- Who runs it: ${LEGAL.name}, ${LEGAL.address}. Built by the product design team at ZeeFrames (https://zeeframes.com/). Contact: ${LEGAL.email}.

## Pages

- [Home](${SITE}/): run a free audit
- [About](${SITE}/about): how an audit works and what it checks
- [Sample report](${SITE}/report/sample): a real audit, start to finish
- [Help centre](${SITE}/help): questions on audits, reports, plans and data
- [UX laws explained](${SITE}/ux-laws)
- [WCAG 2.2 accessibility checklist](${SITE}/accessibility-checklist)
- [UX audit template](${SITE}/ux-audit-template)
- [Changelog](${SITE}/changelog)
- [Privacy policy](${SITE}/privacy) and [Terms of service](${SITE}/terms)

## Blog

${POSTS.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join('\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
