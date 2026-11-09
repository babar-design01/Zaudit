import { AuditUrlBox, PageHero, card, cols, frame, textLink } from '@/components/site/PageKit';
import { PrintButton } from '@/components/site/PrintButton';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata({
  title: 'Free UX audit template and checklist (printable) | ProCurveUX',
  description: 'A printable UX audit checklist covering usability, visual design, accessibility, conversion, UX laws and mobile: the six dimensions every ProCurveUX audit checks.',
  path: '/ux-audit-template',
});

/**
 * `/ux-audit-template`: the six dimensions the homepage's "What's covered"
 * section names, as a checklist someone can print and work through by hand.
 * The items are the questions a reviewer asks; where ProCurveUX measures one
 * itself, the item says so.
 *
 * A Figma or Notion copy to download can be added later; until it exists the
 * page offers the printable checklist only.
 */
const DIMENSIONS: { id: string; name: string; question: string; items: string[] }[] = [
  {
    id: 'usability',
    name: 'Usability',
    question: 'Can visitors find and finish what they came for?',
    items: [
      'The main navigation names what a first-time visitor is looking for, in their words.',
      'Visitors can always tell which page or step they are on.',
      'Every step of a flow has a clear way back or out.',
      'Forms say what went wrong next to the field, and keep what was typed.',
      'Clicking a button visibly does something within a moment: a change, a spinner or a message.',
      'Nothing important can be reached by hover alone.',
    ],
  },
  {
    id: 'visual',
    name: 'UI and visual design',
    question: 'Does the design guide the eye or fight it?',
    items: [
      'The most important thing on each screen is the most visually prominent.',
      'There is one primary button per screen, and it looks different from secondary ones.',
      'Spacing, type sizes and colours come from a small, consistent set.',
      'Related items sit close together; unrelated ones are clearly separated.',
      'Links and buttons look clickable, and decoration does not.',
      'Elements line up on a shared grid.',
    ],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    question: 'Can everyone use it, including with a screen reader or keyboard?',
    items: [
      'Body text has at least 4.5:1 contrast against its background (3:1 for large text).',
      'Every page can be used with the keyboard alone, with a visible focus outline.',
      'Every image that carries meaning has alt text; decorative ones are hidden from screen readers.',
      'Every form field has a visible label, not just placeholder text.',
      'Tap targets are at least 24 by 24 CSS pixels, or spaced so they are easy to hit.',
      'Headings follow a logical order, and each page has one main heading.',
    ],
  },
  {
    id: 'conversion',
    name: 'Conversion and friction',
    question: 'What stands between a visitor and your goal?',
    items: [
      'The main call to action is visible without scrolling, on desktop and on a phone.',
      'The page says what you get, and for whom, in the first screen.',
      'Prices and costs are shown before the final step, not revealed at checkout.',
      'Forms ask only for what the task needs right now.',
      'Proof sits near the decision: reviews, client logos, guarantees or security notes.',
      'Pop-ups and banners can be dismissed and do not cover the call to action.',
    ],
  },
  {
    id: 'ux-laws',
    name: 'UX laws and principles',
    question: 'Does the layout work with human behaviour or against it?',
    items: [
      "Important buttons are large and close to where the eye already is (Fitts's law).",
      "Menus and choices are kept short, or grouped, so deciding is quick (Hick's law).",
      "Common patterns work the way visitors expect from other sites (Jakob's law).",
      "Long content is broken into chunks with headings and lists (Miller's law).",
      'The one thing you want noticed looks different from everything around it (Von Restorff effect).',
      'Screens respond within about 400 milliseconds, or show progress (Doherty threshold).',
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile experience',
    question: 'Does it hold up on a small screen?',
    items: [
      'Nothing scrolls sideways at 320 CSS pixels wide.',
      'Text is readable without zooming, at 16px or close to it for body copy.',
      'The navigation collapses into a menu that is easy to open and close.',
      'Buttons are big enough for a thumb and not crowded together.',
      'Forms bring up the right keyboard for email, phone and number fields.',
      'The first screen loads quickly on a phone connection and does not jump as it loads.',
    ],
  },
];

const HOW = [
  { n: '01', title: 'Pick one page and one goal', body: 'A signup page, a product page or checkout. Write down what a visitor should do there.' },
  { n: '02', title: 'Use it as a visitor would', body: 'On a desktop and on a real phone. Try to reach the goal, and note where you hesitate.' },
  { n: '03', title: 'Work through each dimension', body: 'Tick what passes. For each miss, note the element, why it matters and the fix.' },
  { n: '04', title: 'Rank the fixes', body: 'By how much each hurts the goal, and how much work it is. Fix the quick, painful ones first.' },
];

export default function UxAuditTemplatePage() {
  const total = DIMENSIONS.reduce((n, d) => n + d.items.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main">
        <PageHero
          label="Free template"
          title="UX audit template:"
          accent="a printable checklist."
          intro={`The six dimensions every ProCurveUX audit checks, as ${total} questions you can work through by hand on any page.`}
          trail={[{ name: 'UX audit template', path: '/ux-audit-template' }]}
        >
          <div data-print-hide style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <PrintButton />
          </div>
        </PageHero>

        {/* how to use it */}
        <section aria-labelledby="how-h" data-print-hide>
          <div style={{ ...frame, paddingBottom: '72px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 id="how-h" style={{ margin: 0, font: '800 clamp(24px, 2.4vw, 30px)/1.15 var(--font-sans)', letterSpacing: '-0.025em' }}>
              How to use it
            </h2>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(220, 0) }}>
              {HOW.map((s, i) => (
                <li key={s.n} style={{ padding: '24px 24px 24px 0', borderTop: '2px solid', borderColor: i === 0 ? 'var(--blue)' : 'var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ font: '700 14px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>{s.n}</span>
                  <h3 style={{ margin: 0, font: '700 18px/26px var(--font-sans)' }}>{s.title}</h3>
                  <p style={{ margin: 0, font: '400 15px/25px var(--font-sans)', color: 'var(--ink-secondary)' }}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* the checklist */}
        <section aria-labelledby="list-h" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ ...frame, paddingTop: '72px', paddingBottom: '88px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px 24px' }}>
              <h2 id="list-h" style={{ margin: 0, font: '800 clamp(28px, 3vw, 40px)/1.1 var(--font-sans)', letterSpacing: '-0.03em' }}>
                The checklist
              </h2>
              <span style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>
                Page audited: ______________________ &nbsp; Date: __________
              </span>
            </div>
            <div style={cols(340)}>
              {DIMENSIONS.map((d, di) => (
                <fieldset key={d.id} id={d.id} style={{ ...card, margin: 0, minWidth: 0, gap: '16px', breakInside: 'avoid' }}>
                  <legend style={{ float: 'left', width: '100%', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ font: '700 13px/18px var(--font-sans)', color: 'var(--accent-fg)' }}>{String(di + 1).padStart(2, '0')}</span>
                    <span style={{ font: '800 21px/28px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--ink)' }}>{d.name}</span>
                    <span style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>{d.question}</span>
                  </legend>
                  <ul style={{ clear: 'both', margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {d.items.map((it, ii) => {
                      const id = `${d.id}-${ii}`;
                      return (
                        <li key={id}>
                          <label htmlFor={id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', cursor: 'pointer', font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                            <input id={id} type="checkbox" style={{ flexShrink: 0, width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--blue)' }} />
                            <span>{it}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
            <p style={{ margin: 0, maxWidth: '760px', font: '400 15px/25px var(--font-sans)', color: 'var(--ink-muted)' }}>
              Want the measurable half done for you? ProCurveUX checks contrast, tap targets, labels, heading order, layout shift and more automatically. See the full <a href="/accessibility-checklist" style={textLink}>accessibility checklist</a> and <a href="/ux-laws" style={textLink}>UX laws explained</a> for detail.
            </p>
          </div>
        </section>

        <AuditUrlBox title="Or let ProCurveUX check it for you." text="Paste a URL. ProCurveUX works through the measurable half of this checklist in about a minute, with the element, the rule and the fix for each finding." />
      </main>
      <SiteFooter />
    </div>
  );
}
