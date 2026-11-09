import type { CoverBars, Post } from '../blog';

/*
 * Facts from web.dev: "Cumulative Layout Shift (CLS)", "Optimize Cumulative
 * Layout Shift", "Web Vitals" and "Defining the Core Web Vitals metrics
 * thresholds". All read 9 Nov 2026.
 */
export const post: Post = {
  slug: 'cumulative-layout-shift-fix',
  title: 'Cumulative Layout Shift: what it measures and how to fix it',
  seoTitle: 'How to Fix Cumulative Layout Shift (CLS): Causes, Scores and Code',
  description:
    'CLS scores how much a page jumps while people use it. Good is 0.1 or less at the 75th percentile. The common causes, how to measure them, and fixes.',
  date: '2026-11-09',
  category: 'Performance',
  tags: ['Core Web Vitals', 'CLS', 'Performance'],
  author: 'muhammad-babar',
  cover: 'layoutshift',
  body: [
    {
      type: 'answer',
      text: 'Cumulative Layout Shift (CLS) measures how much visible content moves unexpectedly while a page is open. A score of 0.1 or less is good, up to 0.25 needs improvement, and above 0.25 is poor, judged at the 75th percentile of page loads on mobile and desktop. Most shifts come from images without dimensions, ads and embeds, late web fonts and injected banners. The fix is almost always the same: reserve the space before the content arrives.',
    },
    {
      type: 'p',
      text: "You go to tap a link and the page drops by a few hundred pixels. You hit an advert instead. web.dev gives a worse example: a shift that makes someone confirm a large order they meant to cancel. A button can be perfectly [sized for a thumb](/blog/tap-target-size-guidelines) and still get missed if it moves at the wrong moment. This post explains how CLS is calculated, what a good score is, what causes shifts and how to fix each cause, with code.",
    },

    { type: 'h2', text: 'What does CLS measure?' },
    {
      type: 'p',
      text: 'web.dev defines CLS as the largest burst of layout shift scores for every unexpected layout shift that happens during the entire life of a page. A layout shift happens when a visible element changes its position from one rendered frame to the next.',
    },
    {
      type: 'p',
      text: "Only existing elements that change their start position count. Adding a new element, or resizing one, is not a shift by itself. It becomes one when it pushes other visible elements out of place. So an image that loads and grows from zero height doesn't shift, but the paragraph it pushes down does.",
    },
    { type: 'h3', text: 'Session windows' },
    {
      type: 'p',
      text: 'Shifts are grouped into bursts called session windows. A window holds shifts that happen less than 1 second apart, and lasts at most 5 seconds. Your CLS is the window with the highest total. CLS used to be the sum of every shift over the whole visit, and some tools can still report it that way.',
    },
    { type: 'h3', text: 'How a single shift is scored' },
    {
      type: 'p',
      text: "Each shift's score is the impact fraction multiplied by the distance fraction. The impact fraction is how much of the viewport the moving elements cover, counting both where they were and where they ended up. The distance fraction is the furthest any of them moved, divided by the viewport's largest dimension.",
    },
    {
      type: 'p',
      text: "web.dev's worked example: an element filling half the viewport moves down by 25% of the viewport height. Before and after together it covers 75% of the viewport, so the impact fraction is 0.75. It moved 25% of the height, so the distance fraction is 0.25. The shift scores 0.75 × 0.25 = 0.1875. That single shift is enough to put the page into \"needs improvement\".",
    },
    { type: 'h3', text: 'Which shifts are excluded' },
    {
      type: 'p',
      text: 'Shifts within 500 milliseconds of a tap, click or key press are flagged with `hadRecentInput` and left out, because the user expects the page to react. Scrolling, dragging and pinch-zooming do not count as input, so content that jumps while someone scrolls still counts against you.',
    },

    { type: 'h2', text: 'What is a good CLS score?' },
    {
      type: 'table',
      caption: 'Core Web Vitals thresholds for CLS. Source: web.dev, Defining the Core Web Vitals metrics thresholds',
      head: ['Rating', 'CLS at the 75th percentile', 'What it means'],
      rows: [
        ['Good', '0.1 or less', 'At least 75% of page views meet the good threshold'],
        ['Needs improvement', 'Above 0.1, up to 0.25', 'Neither good nor poor'],
        ['Poor', 'Above 0.25', 'At least 25% of page views are above 0.25'],
      ],
    },
    {
      type: 'p',
      text: 'The 75th percentile is what makes the score fair to real traffic. A page is rated good only if at least 75% of its page views have a CLS of 0.1 or less, and rated poor if at least 25% are above 0.25. Google measures mobile and desktop separately. A page passes the Core Web Vitals assessment when it meets the good threshold at the 75th percentile for all three metrics: LCP, INP and CLS.',
    },
    {
      type: 'p',
      text: "Why 0.1? In Google's internal testing, shifts of 0.15 and higher were consistently seen as disruptive, while shifts of 0.1 and lower were noticeable but not excessively disruptive. CLS has no unit. It is not a time in seconds like the other two Core Web Vitals.",
    },

    { type: 'h2', text: 'The common causes of layout shift' },
    {
      type: 'list',
      items: [
        { lead: 'Images and video without dimensions.', text: 'The browser has no idea how tall they are until the file downloads, so it gives them no space and the text below jumps.' },
        { lead: 'Ads, embeds and iframes.', text: "web.dev calls ads one of the largest contributors to layout shifts on the web. Embedded videos, maps and social posts often don't know their own size until they load." },
        { lead: 'Injected banners and forms.', text: 'Cookie notices, promo bars and sign-up forms that pop in at the top of the page push everything else down. Content injected near the top usually causes bigger shifts than content lower down.' },
        { lead: 'Late web fonts.', text: 'Text is laid out in a fallback font first. When the web font arrives and is a different size, the text block and everything around it moves, even if the text was invisible while it waited.' },
        { lead: 'Animating layout properties.', text: 'Changing `top` or `left` causes layout shifts, even when the element has its own layer. Animating `width` and `height` moves the content around it.' },
      ],
    },

    { type: 'h2', text: 'How to fix each cause' },
    { type: 'h3', text: 'Give every image and video its dimensions' },
    {
      type: 'p',
      text: 'Set `width` and `height` attributes, then let CSS make the image responsive: `<img src="hero.jpg" width="1200" height="600" alt="...">` with `img { width: 100%; height: auto; }`. Browsers work out the aspect ratio from the two attributes before the image loads, so the space is reserved at the right height. Without attributes, use the CSS `aspect-ratio` property, for example `aspect-ratio: 16 / 9`.',
    },
    {
      type: 'p',
      text: 'With `srcset`, keep every candidate image at the same aspect ratio. With art direction in `<picture>`, put `width` and `height` on each `<source>` too.',
    },
    { type: 'h3', text: 'Reserve space for ads and embeds' },
    {
      type: 'p',
      text: 'Give the slot a size before anything arrives, for example `.ad-slot { min-height: 250px; }`, or an `aspect-ratio` for responsive embeds. If ad sizes vary, reserve the most likely size or the smallest one and accept a small shift for larger ads. Never collapse the slot when no ad is returned. Show a placeholder instead, because removing reserved space shifts the page just as much as adding content does. Where you cannot reserve space, place the late content lower on the page.',
    },
    { type: 'h3', text: "Don't push content down without a tap" },
    {
      type: 'p',
      text: "Show banners and notices in space you reserved in advance, or take them out of the document flow so they overlay the page, for example with `position: fixed`. For feeds and product lists, let people load new content with a \"Load more\" button. Shifts within 500 milliseconds of that tap don't count, and if the fetch takes longer, reserve the space straight away so the later arrival moves nothing.",
    },
    { type: 'h3', text: 'Stop fonts from reflowing text' },
    {
      type: 'list',
      items: [
        'Use `font-display: optional`, so the web font is only used if it is ready by the first layout.',
        'Always name a fallback, as in `font-family: "Brand Sans", sans-serif;`. Without one, Chrome falls back to Times, a serif and a poor match.',
        'Match the fallback to the web font with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override`.',
        'Load critical fonts early with `<link rel="preload">`, so they have a better chance of arriving before the first paint.',
      ],
    },
    { type: 'h3', text: 'Animate with transform' },
    {
      type: 'p',
      text: 'Use `transform: translate()` to move an element and `transform: scale()` to grow it, instead of changing `top`, `left`, `width` or `height`. Composited animations using translate cannot affect other elements, so they do not count towards CLS. Respect `prefers-reduced-motion` for visitors who are sensitive to movement.',
    },
    {
      type: 'tip',
      label: 'Also:',
      text: 'Make sure your pages are eligible for the back/forward cache. A page restored from it appears exactly as the visitor left it, with none of the shifts of a fresh load.',
    },

    { type: 'h2', text: 'How to measure CLS in the lab and in the field' },
    {
      type: 'p',
      text: 'Lab tools load the page in a test environment: Chrome DevTools, Lighthouse, PageSpeed Insights and WebPageTest. Field tools report what real visitors experienced: the Chrome User Experience Report (CrUX), PageSpeed Insights, the Core Web Vitals report in Search Console and the `web-vitals` JavaScript library.',
    },
    {
      type: 'p',
      text: 'The two often disagree, and that is expected. Lab tools usually measure only the initial page load. CrUX measures the whole life of the page, including lazy-loaded content that shifts as people scroll and slow transitions in single-page apps. So lab CLS can be lower than what users see. PageSpeed Insights shows both: field data under "Discover what your real users are experiencing" and lab data under "Diagnose performance issues". A big gap between them usually means post-load shifts.',
    },
    {
      type: 'list',
      items: [
        { lead: 'Find the shifts.', text: 'Record a trace in the DevTools Performance panel. The Layout Shifts track groups shifts into clusters, and clicking one shows what moved.' },
        { lead: 'Read Lighthouse carefully.', text: 'It lists the elements that shifted, which are often the victims rather than the cause. Look at what was inserted or resized above them.' },
        { lead: 'Measure real users.', text: "Add `import { onCLS } from 'web-vitals'; onCLS(console.log);`, or watch raw entries with a `PerformanceObserver` that calls `observe({ type: 'layout-shift', buffered: true })`." },
      ],
    },
    {
      type: 'tip',
      label: 'Check:',
      text: 'When PageSpeed Insights has no data for a URL, it may show data for your whole origin instead. Confirm which one you are looking at before hunting for a shift on the wrong page.',
    },

    { type: 'h2', text: 'How ProCurveUX checks layout shift' },
    {
      type: 'p',
      text: 'ProCurveUX loads your page in a real browser at desktop and mobile sizes and records every layout shift that was not caused by input while the page loads. The "Content jumps while the page loads" check flags the page when the total passes 0.1, with the score and the number of shifts it saw. The "Images oversized, unsized or eagerly loaded" check flags images in view that have no dimensions, the most common cause. A static screenshot cannot see any of this, because a shift only exists while the page is moving. That is one reason we [audit in a real browser](/blog/screenshot-vs-real-browser-ux-audit).',
    },
    {
      type: 'p',
      text: "Like any lab test, it sees one load of the page. It will catch shifts during loading, but not ones that happen later as someone scrolls. Confirm the result against field data in Search Console or PageSpeed Insights. You can see how findings are presented in a [sample report](/report/sample).",
    },

    { type: 'h2', text: 'Frequently asked questions' },
    {
      type: 'faq',
      items: [
        {
          q: 'What is a good CLS score?',
          a: '0.1 or less at the 75th percentile of page loads. Above 0.1 and up to 0.25 needs improvement, and above 0.25 is poor.',
        },
        {
          q: 'Why is my CLS different in Lighthouse and in field data?',
          a: 'Lighthouse measures a single page load in a lab. Field data from CrUX covers the whole visit for real users, including shifts after the page has loaded, so it is often higher.',
        },
        {
          q: 'Do layout shifts after a click count towards CLS?',
          a: 'Not if they happen within 500 milliseconds of a tap, click or key press. Scrolling does not count as input, so shifts while scrolling are included.',
        },
        {
          q: 'Can lazy loading cause layout shift?',
          a: 'Yes, if the lazy-loaded image or embed has no reserved space. Give it width and height attributes or an aspect ratio, and it loads into space that is already there.',
        },
        {
          q: 'Is CLS measured in seconds?',
          a: 'No. CLS is a unitless score based on how much of the screen moved and how far, unlike LCP and INP, which are measured in time.',
        },
      ],
    },
  ],
  sources: [
    {
      title: 'Cumulative Layout Shift (CLS)',
      publisher: 'web.dev (Google)',
      note: 'definition, session windows, layout shift score; last updated April 12, 2023',
      url: 'https://web.dev/articles/cls',
    },
    {
      title: 'Optimize Cumulative Layout Shift',
      publisher: 'web.dev (Google)',
      note: 'common causes and fixes; last updated February 7, 2025',
      url: 'https://web.dev/articles/optimize-cls',
    },
    {
      title: 'Web Vitals',
      publisher: 'web.dev (Google)',
      note: '75th percentile assessment; last updated October 31, 2024',
      url: 'https://web.dev/articles/vitals',
    },
    {
      title: 'Defining the Core Web Vitals metrics thresholds',
      publisher: 'web.dev (Google)',
      note: 'good, needs improvement and poor thresholds; last updated May 7, 2025',
      url: 'https://web.dev/articles/defining-core-web-vitals-thresholds',
    },
  ],
  cta: {
    title: 'See what moves on your page while it loads',
    text: 'Paste your URL into ProCurveUX for a free audit. It measures layout shift in a real browser at desktop and mobile sizes and gives you a ranked fix list in about a minute.',
  },
};

export const motif: CoverBars = {
  title: 'CLS thresholds · p75',
  chip: 'CLS',
  rows: [
    { label: 'Good', value: '≤0.1', share: 33 },
    { label: 'Needs work', value: '≤0.25', share: 83 },
    { label: 'Poor', value: '>0.25', share: 100, strong: true },
  ],
};
