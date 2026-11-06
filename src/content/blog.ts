/**
 * Blog posts. Each body is Markdown rendered by `@/lib/markdown`. Keep the
 * title short (it is the H1), and put the search-facing wording in `seoTitle`
 * and `description`. Every figure in a body links to its source.
 */

export type Faq = { q: string; a: string };

export type Post = {
  slug: string;
  title: string;
  /** The <title> tag; falls back to `title`. Keep under ~60 characters. */
  seoTitle?: string;
  /** Meta description and the listing summary. 140–160 characters. */
  description: string;
  /** ISO date, YYYY-MM-DD. */
  published: string;
  updated?: string;
  author: string;
  authorRole: string;
  readMinutes: number;
  keywords: string[];
  /** Short answer shown at the top, also what AI search tends to quote. */
  summary: string;
  body: string;
  /** Rendered from `body`; listed here too so FAQPage structured data matches. */
  faqs: Faq[];
};

const AUTHOR = 'Babar';
const AUTHOR_ROLE = 'Co-founder & Design Director, ZeeFrames';

export const POSTS: Post[] = [
  {
    slug: 'screenshot-vs-real-browser-ux-audit',
    title: 'Screenshot vs. real browser: what UX tools miss',
    seoTitle: 'Screenshot vs Real Browser UX Audits: What Static Tools Miss',
    description:
      "Screenshot-based UX tools found just 14% of live-page issues in Baymard's test. See the hover, focus, layout-shift and mobile problems only a real browser catches.",
    published: '2026-11-06',
    author: AUTHOR,
    authorRole: AUTHOR_ROLE,
    readMinutes: 9,
    keywords: [
      'UX audit tool comparison',
      'AI UX audit accuracy',
      'live site UX testing',
      'screenshot UX analysis',
      'real browser UX audit',
    ],
    summary:
      "A screenshot shows how a page looks, not how it behaves. In Baymard's test, an AI reviewing screenshots found 26% of the issues visible in the image but only 14% of the issues present on the live page. Hover states, keyboard focus, layout shift, interaction speed and touch-only problems can only be found by loading and using the page in a real browser.",
    faqs: [
      {
        q: 'Can AI do a UX audit from a screenshot?',
        a: "It can spot some visual issues, but it misses anything interactive. In Baymard's 2023 test, GPT-4 found only 14% of the issues present on live pages when working from screenshots.",
      },
      {
        q: 'What is the difference between a static scan and real-browser testing?',
        a: 'A static scan reads the page’s code. Real-browser testing loads the page, renders it with all its styles and scripts, and interacts with it the way a visitor would. Only real-browser testing can measure behaviour, timing and layout shift.',
      },
      {
        q: 'Why do layout shift and INP need a real browser?',
        a: 'Both are runtime measurements. Layout shift happens while content loads, and INP measures the delay after a real interaction. A screenshot or code file captures neither.',
      },
      {
        q: 'Does Lighthouse test in a real browser?',
        a: "Yes. Lighthouse loads pages in Chrome and measures performance and some accessibility rules. It doesn't evaluate UX heuristics, conversion friction or goal-based priorities.",
      },
      {
        q: 'Is screenshot analysis ever enough?',
        a: "For reviewing a design before it's built, or checking visual hierarchy, yes. For auditing a live website, it should be combined with real-browser testing.",
      },
    ],
    body: `Ask most AI UX tools to review your site and they do one of two things. They take a screenshot and ask a model what it sees, or they read your HTML and check it against rules. Both are fast and cheap, and both miss a whole class of problems.

Those problems are the ones users actually feel: the menu that won't open on a phone, the button that jumps away just as you tap it, the focus ring hidden behind a sticky header. This post explains what each kind of tool can and can't see, and how to tell which one you're using.

### The evidence at a glance

| Finding | Figure | Source |
| --- | --- | --- |
| Issues on a live page found by AI reviewing screenshots | 14% | Baymard, 2023 |
| Accuracy of AI UX tools tested in 2025 | 50–75% | Microsoft UX researchers, via Baymard, 2026 |
| Sites that remove the browser's default focus outline | 67% | Web Almanac, 2025 |
| Sites using the more accessible \`:focus-visible\` | 25% | Web Almanac, 2025 |
| Mobile pages with at least one image missing dimensions (a layout-shift risk) | 62% | Web Almanac, 2025 |
| Mobile pages with non-composited animations | 40% | Web Almanac, 2025 |
| Mobile sites with good INP vs desktop | 77% vs 97% | Web Almanac, 2025 |
| Home pages passing Core Web Vitals on mobile vs secondary pages | 45% vs 56% | Web Almanac, 2025 |

Every item in that table describes something that happens while a page loads or is used. None of it is visible in a still image.

## How do UX audit tools actually analyse a page?

There are three main approaches. Most tools use one; a few combine them.

| Method | What the tool sees | Good at | Blind to |
| --- | --- | --- | --- |
| **Screenshot analysis** | A flat image of the page at one moment | Visual hierarchy, layout, obvious contrast problems, design reviews of mockups | Anything that moves, responds, loads late or depends on interaction |
| **Static code scan** | The HTML source, sometimes before scripts run | Missing labels, alt text, heading structure, ARIA errors | Rendered layout, real colours after CSS, timing, behaviour |
| **Real-browser testing** | The fully rendered page, loaded and used like a visitor would | Everything above, plus hover, focus, keyboard, layout shift, speed and mobile behaviour | Brand fit, copy tone, multi-page task flows (these need a human) |

The difference isn't just technical. It decides which of your users' problems ever show up in the report.

## What does the evidence say about screenshot-based audits?

The clearest test comes from Baymard Institute. In 2023, they uploaded screenshots of 12 ecommerce pages (from Lego, REI, Zalando, Expedia and others) to GPT-4 and asked what UX improvements could be made. They then compared its 178 suggestions line by line with 257 issues found by six trained UX benchmarkers who used the live sites ([Baymard, 2023](https://baymard.com/research-articles/gpt-ux-audit)).

| Measure | Result |
| --- | --- |
| Issues found that were visible in the screenshot | 25.5% |
| Issues found that were present on the live page | 14.1% |
| Accuracy of GPT-4's suggestions | 19.9% |
| False-positive error rate | 80.1% |
| Issues overlooked per live page (average) | 18.5 |

The gap between 26% and 14% is the part that matters here. Even if the AI had been perfect at reading the image, it could never have found the issues that only appear when you interact with the page. Baymard's conclusion was that many UX issues require clicking buttons, hovering images and moving between pages to discover.

This is a property of the method, not of one model. A better model reading a better screenshot still can't see a hover state that never happened.

Newer tools haven't closed the gap. In March 2025, two Microsoft UX researchers tested AI tools on heuristic evaluations and found accuracy rates of 50%, 62%, 67% and 75%. The best score came from a tool set to report far fewer issues: it missed 13 of the 16 problems a human expert found on the same page ([Baymard, 2026](https://baymard.com/research-articles/ai-heuristic-evaluations)).

Even rule-based scanners have limits. The 2025 Web Almanac points to a GOV.UK comparison of popular automated accessibility tools, all of which detected fewer than 50% of known errors ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/accessibility)).

## Six problems only a real browser can find

### 1. Hover and interactive states

Buttons, links and cards should change when a user hovers, taps or focuses on them. That feedback tells people an element is clickable. A screenshot captures the resting state only, so it can't tell whether an element responds at all. Hover-only menus are a related problem: they work with a mouse and fail completely on a touch screen.

### 2. Invisible keyboard focus

Keyboard users, and many power users, move through a page with the Tab key. WCAG 2.4.7 (Focus Visible) requires a visible indicator showing where focus is. Many sites remove the default focus outline for visual reasons and never replace it. The only way to test this is to tab through the page and watch.

This is common. In 2025, **67% of sites explicitly removed the default focus outline** with \`:focus { outline: 0 }\`, up 14% from 2024. Only about a quarter used \`:focus-visible\`, the modern way to show focus only when it's needed ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/accessibility)). Removing the outline isn't always a failure, since a site may add its own style. But you can only confirm that by tabbing through the page. The Web Almanac's authors note that automated tools like Lighthouse are limited on keyboard traps, focus order and whether focus moves logically to new content.

### 3. Focus hidden behind sticky elements

WCAG 2.2 added criterion 2.4.11, Focus Not Obscured (Minimum). It fails when a sticky header, chat widget or cookie banner covers the element a user has tabbed to. The page looks fine in a screenshot. It only breaks when focus moves under the sticky element, which a static tool never triggers.

### 4. Layout shift

Layout shift happens when content moves after it first appears: a late-loading banner pushes text down, or a web font swaps in and reflows a heading. Users tap the wrong thing or lose their place. It's measured as Cumulative Layout Shift (CLS), where 0.1 or less counts as good. A finished screenshot shows the page after everything settles, so the shift is invisible.

The 2025 Web Almanac found 81% of mobile sites have good CLS, which means roughly one in five still don't ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)).

Desktop is worse: only 72% of desktop pages have good CLS. The causes are well known, and all of them are invisible in a finished screenshot ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)):

| Layout-shift cause | How common (mobile, 2025) |
| --- | --- |
| Pages with at least one image missing width and height | 62% |
| Pages using at least one web font | 87% |
| Pages preloading fonts to avoid a swap | 15–16% |
| Pages with non-composited animations | 40% |

### 5. Slow responses to taps and clicks

Interaction to Next Paint (INP) measures how long a page takes to visibly respond after a user acts. 200 milliseconds or less is good. Heavy menus, filters and forms often fail on phones. In 2025, 77% of mobile sites had good INP ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)). INP only exists when someone interacts, so neither a screenshot nor a code scan can measure it.

The gap between devices is large. 97% of desktop sites have good INP, compared with 77% on mobile. Deeper pages fare worse: only 69% of mobile secondary pages, where filters, carousels and form validation live, have good INP. The median mobile page also spends 1,916 milliseconds with its main thread blocked, up 58% from 2024 ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)).

### 6. Mobile-only breakage

A desktop screenshot says nothing about a 390px phone screen. Real-browser testing at mobile width finds content that overflows, buttons smaller than WCAG 2.5.8's 24×24px minimum, and sticky bars that cover the main action. Overall, 48% of mobile sites pass all three Core Web Vitals, compared with 56% on desktop ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)).

Mobile problems pile up fastest on the pages that matter most. Only 45% of mobile home pages pass Core Web Vitals, compared with 56% of secondary pages. On mobile, 62% of sites load their main content within 2.5 seconds, against 74% on desktop ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/performance)). And 19% of mobile sites still block pinch-to-zoom, which makes them hard to use for people with low vision ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/accessibility)).

**Bonus: keyboard traps.** A modal or menu that lets keyboard users tab in but not out (WCAG 2.1.2). Again, you only find it by trying.

## When is screenshot analysis still useful?

Screenshots aren't useless. They're the right tool for some jobs:

- **Reviewing designs before they're built.** A Figma mockup has no live behaviour yet, so an image is all there is.
- **Checking visual hierarchy.** Is the main call to action the most prominent thing on the page? A static view can answer that.
- **Narrow, well-defined checks.** Baymard's UX-Ray 2.0 analyses screenshots and live URLs with a documented 95% accuracy rate, measured against human auditors across 79 websites ([Baymard, 2026](https://baymard.com/research-articles/ai-heuristic-evaluations)). It gets there by limiting itself to specific, research-backed heuristics and not asking an AI to judge good or bad UX.

The takeaway is not "never use screenshots." It's that screenshot analysis covers a subset of UX. If that's all your tool does, a large share of real problems will never reach your report.

## How can you tell which kind of tool you're using?

Marketing pages rarely say how a tool works. Ask these five questions:

1. **Does it load my live URL, or analyse an uploaded image?** If you can upload a screenshot and get the same report, it's screenshot-based.
2. **Does it test at mobile width?** Look for a stated viewport, such as 390px wide, not just "mobile-friendly" claims.
3. **Does it interact with the page?** Look for keyboard (Tab) testing, hover checks and scrolling.
4. **Does it measure CLS and INP?** These require loading and using the page. A tool that reports them is running a real browser.
5. **Does it show evidence for each finding?** A screenshot of the exact element plus its CSS selector lets you check the finding yourself. Vague advice like "improve your hierarchy" can't be verified.

If a tool can't answer yes to questions 1, 3 and 4, assume it can't see interaction problems.

## How ProCurveUX tests a live page

ProCurveUX was built around real-browser testing because that's where the problems users feel actually live.

When you paste a URL:

1. **The page loads in a real Chromium browser** at two sizes: desktop (1440×900) and mobile (390×844).
2. **It's used like a visitor would use it.** ProCurveUX scrolls the page, hovers over interactive elements, tabs through with the keyboard and records Core Web Vitals as the page loads.
3. **Every result is checked against 120+ rules** from UX laws, Nielsen's 10 heuristics, visual design principles and WCAG 2.2 AA.
4. **Each finding comes with evidence:** a screenshot with the element highlighted, its CSS selector and the pages it appears on.
5. **Fixes are ranked by your goal**, whether that's sign-ups, demo bookings, checkout or support deflection.

We're also clear about the limits. About two-thirds of our rules are tested automatically. The rest, such as brand fit, copy tone and multi-page task flows, are flagged for your review with a short checklist.

## Key takeaways

- UX tools analyse pages in three ways: screenshots, static code scans or a real browser. Only a real browser sees how the page behaves.
- In Baymard's test, screenshot analysis found 26% of issues visible in the image but only 14% of those on the live page. AI tools tested in 2025 still scored only 50–75% accuracy.
- 67% of sites remove the default focus outline, and only 25% use \`:focus-visible\`. Whether focus is still visible can only be checked by tabbing through the page.
- 62% of mobile pages have at least one image without dimensions, a leading cause of layout shift that a screenshot never shows.
- Mobile INP lags desktop badly (77% vs 97% good), and only 45% of mobile home pages pass Core Web Vitals.
- Screenshots are still useful for design mockups and narrow visual checks.
- Before choosing a tool, ask whether it loads your live URL, tests at mobile width, interacts with the page and measures CLS and INP.

## Frequently asked questions

### Can AI do a UX audit from a screenshot?

It can spot some visual issues, but it misses anything interactive. In Baymard's 2023 test, GPT-4 found only 14% of the issues present on live pages when working from screenshots.

### What is the difference between a static scan and real-browser testing?

A static scan reads the page's code. Real-browser testing loads the page, renders it with all its styles and scripts, and interacts with it the way a visitor would. Only real-browser testing can measure behaviour, timing and layout shift.

### Why do layout shift and INP need a real browser?

Both are runtime measurements. Layout shift happens while content loads, and INP measures the delay after a real interaction. A screenshot or code file captures neither.

### Does Lighthouse test in a real browser?

Yes. Lighthouse loads pages in Chrome and measures performance and some accessibility rules. It doesn't evaluate UX heuristics, conversion friction or goal-based priorities.

### Is screenshot analysis ever enough?

For reviewing a design before it's built, or checking visual hierarchy, yes. For auditing a live website, it should be combined with real-browser testing.

## References

1. Baymard Institute, "Testing ChatGPT-4 for 'UX Audits' Shows an 80% Error Rate & 14–26% Discoverability Rate," October 18, 2023. [baymard.com](https://baymard.com/research-articles/gpt-ux-audit)
2. Baymard Institute, "AI Heuristic UX Evaluations with a 95% Accuracy Rate," updated May 28, 2026 (includes Microsoft UX researchers' March 2025 tests). [baymard.com](https://baymard.com/research-articles/ai-heuristic-evaluations)
3. HTTP Archive, Web Almanac 2025, Performance chapter (CrUX and HTTP Archive data, July 2025), published January 15, 2026. [almanac.httparchive.org](https://almanac.httparchive.org/en/2025/performance)
4. HTTP Archive, Web Almanac 2025, Accessibility chapter, published January 15, 2026. [almanac.httparchive.org](https://almanac.httparchive.org/en/2025/accessibility)
5. W3C, Web Content Accessibility Guidelines (WCAG) 2.2, criteria 2.1.2, 2.4.7, 2.4.11 and 2.5.8.`,
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first. */
export function listPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.published.localeCompare(a.published));
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
