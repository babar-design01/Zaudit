/**
 * Prints every UI rule's outcome for one page: `tsx scripts/ui-dump.ts <url>`,
 * or with no URL, the fixture HTML in UI_DUMP_HTML. A debugging aid.
 */
import { gotoLoader, measurePage } from '../src/lib/audit/browser';
import { docFacts, parseHtml } from '../src/lib/audit/document';
import { evaluate } from '../src/lib/audit/evaluate';

async function main() {
  const url = process.argv[2];
  // The SSRF guard refuses localhost, which is right for the API and wrong for
  // checking this project's own dev server from a script.
  const local = url && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);
  const m = await measurePage(
    url
      ? local
        ? async (p) => (await p.goto(url, { waitUntil: 'domcontentloaded' }))?.status() ?? null
        : gotoLoader(url)
      : async (p) => (await p.setContent(process.env.UI_DUMP_HTML ?? '<p>empty</p>'), 200),
  );
  if (!m) throw new Error('no browser');
  for (const k of ['facts', 'axe', 'keyboard', 'reduce', 'ux', 'forms', 'toasts', 'ui', 'imageText', 'states', 'dark', 'stress'] as const) {
    const s = m[k];
    console.log(k, s.ok ? `${s.ms}ms` : `FAILED ${s.error}`);
  }
  const doc = docFacts(parseHtml(m.html, m.finalUrl)!, m.finalUrl, 200);
  const ev = evaluate({ measured: m, noBrowser: null, doc, pageType: { type: 'landing', confidence: 1, source: 'signals', signals: [] }, platforms: ['web', 'webapp'] });
  for (const o of ev.checks.filter((x) => x.id.startsWith('UI'))) {
    console.log(o.id, o.status.padEnd(14), (o.note ?? '').slice(0, 260));
  }
  if (m.states.ok) console.log('states:', m.states.value.items.map((i) => `${i.name}:${i.hover ? 'H' : '-'}${i.active ? 'A' : '-'}${i.note ? `(${i.note})` : ''}`).join(' '));
  process.exit(0);
}
main();
