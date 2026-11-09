/**
 * The blog: every article, newest first. `/blog` lists them and
 * `/blog/<slug>` renders one, so adding an article is adding an entry here.
 *
 * A body is a list of blocks rather than HTML, so an article cannot break the
 * page's layout or styles:
 *   `answer`  the short answer, boxed, at the top
 *   `p`       a paragraph; `lead` is set in bold before it
 *   `h2`      a section heading, listed in "On this page"; `h3` a sub-heading, not listed
 *   `list`    bullets, or numbers with `ordered`; an item can have a bold lead
 *   `tip`     a highlighted note; `label` is set in bold before it
 *   `table`   a table with a header row; on a phone each row becomes a card
 *   `faq`     questions and answers, also given to search engines as an FAQ
 *
 * In the text of a `p`, `tip` or list item, `[label](/path)` is a link and a
 * phrase in backticks is set as code.
 */

/** A list item: plain text, or a bold lead-in followed by the text. */
import { NEW_POSTS } from './posts';

export type ListItem = string | { lead: string; text: string };

export type Block =
  | { type: 'answer'; text: string }
  | { type: 'p'; text: string; lead?: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; items: ListItem[]; ordered?: boolean }
  | { type: 'tip'; text: string; label?: string }
  | { type: 'table'; caption: string; head: string[]; rows: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] };

/**
 * Word limits for what a card shows, so every card in a row is the same shape
 * and nothing is cut off. An article over either limit stops the build with a
 * message saying which field and by how much (the check is at the end).
 */
export const WORD_LIMITS = { title: 12, description: 30 } as const;

export type Post = {
  slug: string;
  /** The topic: the label above the title. One per article. */
  category: string;
  /** At most WORD_LIMITS.title words. */
  title: string;
  /** The title search results show, when it should differ from `title`. Without one, "<title> | ProCurveUX". */
  seoTitle?: string;
  /** One or two sentences, at most WORD_LIMITS.description words: the card and the search-result snippet. */
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** Shown as #tags under the date. Two or three is plenty. */
  tags: string[];
  /** Who wrote it: a key of AUTHORS. Shown on the article page, linking to /blog/author/<key>. */
  author: AuthorId;
  /** The picture drawn on the cover: see components/blog/BlogCover. */
  cover: Cover;
  /** Shown large at the top of /blog. Without one, the newest article is. */
  featured?: boolean;
  body: Block[];
  /** What the article's facts rest on, listed as References at its end. Check each link opens before adding it. */
  sources: Source[];
  /** The call to action that closes the article. */
  cta?: { title: string; text: string };
};

/** `note` follows the publisher: a date, or what the source covers. */
export type Source = { title: string; publisher: string; url: string; note?: string };

export type Cover = 'coverage' | 'browser' | 'conversion' | 'lawsuits' | 'wcag22' | 'contrast' | 'targets' | 'layoutshift' | 'heuristics' | 'zeeframes';

/** A cover's picture for an article that has a headline figure: see BARS in components/blog/BlogCover. */
export type CoverBars = { title: string; chip: string; rows: { label: string; value: string; share: number; strong?: boolean }[] };

/** Organisations whose name links to their site wherever an author's role or bio mentions it. */
export const ORG_LINKS: Record<string, string> = {
  ZeeFrames: 'https://zeeframes.com/',
};

export type Author = {
  name: string;
  /** One line under the name: what they do, in plain words. */
  tagline: string;
  /** Job title and company, one line: the byline and the header. */
  role: string;
  /** Under /public. Square, at least 400px. Without one, initials are shown. */
  photo?: string;
  location?: string;
  /** "About <first name>": paragraphs. */
  bio: string[];
  /** Positions held, current first. A link opens the organisation. */
  roles: { title: string; org: string; href?: string; note: string }[];
  /** Skills, one per line. */
  expertise: string[];
  /** What they write about here. */
  topics: string[];
  /** Degrees and courses, one per line. The box is hidden while empty. */
  education: string[];
  /** Profiles elsewhere. An href of '#' is a placeholder: shown, but not given to search engines. */
  links: { label: string; href: string }[];
};

/*
 * Muhammad Babar: name and role as he gave them. Photo, bio facts and
 * expertise are from his site, babar.info (read 6 Nov 2026).
 * LinkedIn, Dribbble and Behance links as he gave them (6 Nov 2026).
 * TODO(content): his topics and education are to come from him.
 */
export const AUTHORS = {
  'muhammad-babar': {
    name: 'Muhammad Babar',
    tagline: 'Product designer for SaaS, fintech and AI',
    role: 'Co-Founder and Design Director, ZeeFrames',
    photo: '/blog/authors/muhammad-babar.webp',
    location: 'Lahore, Pakistan',
    bio: [
      'Muhammad Babar is Co-Founder and Design Director at ZeeFrames, a digital design agency in Lahore. He has spent more than eight years designing SaaS, fintech and AI products, and has delivered over 300 projects across more than 20 industries.',
      'His work runs from UX research and strategy through wireframes and prototypes to design systems and finished web and mobile apps. He works remotely with teams in the US, the UK, the Gulf and Australia.',
      'On the ProCurveUX blog he writes about the UX problems that quietly cost websites customers, and the specific changes that fix them.',
    ],
    roles: [
      { title: 'Co-Founder and Design Director', org: 'ZeeFrames', href: 'https://zeeframes.com/', note: 'Digital design agency, Lahore.' },
    ],
    expertise: [
      'UX research and strategy',
      'Wireframing and prototyping',
      'Web and mobile app design',
      'Design systems',
      'SaaS and fintech product design',
      'AI product design',
    ],
    topics: ['UX audits', 'Conversion design', 'Accessibility', 'Design systems', 'SaaS product design'],
    education: [],
    links: [
      { label: 'Website', href: 'https://babar.info' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/babar-product-designer-ux-ui-designer/' },
      { label: 'Dribbble', href: 'https://dribbble.com/mbadobe2' },
      { label: 'Behance', href: 'https://www.behance.net/mbadobe2' },
    ],
  },
} satisfies Record<string, Author>;

export type AuthorId = keyof typeof AUTHORS;

export const authorOf = (post: Post): Author & { id: AuthorId } => ({ id: post.author, ...AUTHORS[post.author] });
export const postsBy = (id: AuthorId): Post[] => POSTS.filter((p) => p.author === id);

export const POSTS: Post[] = [
  // The newer articles, one file each in content/posts.
  ...NEW_POSTS,
  {
    slug: 'ada-website-lawsuit-statistics',
    title: "ADA website lawsuits: why the numbers don't match",
    seoTitle: 'ADA Website Lawsuit Statistics 2025–2026, Explained',
    description:
      'Trackers counted 3,117, 3,948 or 5,114 ADA website lawsuits in 2025. Here is why the counts differ, and what every tracker agrees on.',
    date: '2026-11-06',
    category: 'Accessibility',
    tags: ['ADA lawsuits', 'Accessibility', 'WCAG 2.2'],
    author: 'muhammad-babar',
    cover: 'lawsuits',
    body: [
      {
        type: 'answer',
        text: 'Depending on which tracker you read, there were 3,117, 3,948 or 5,114 ADA website lawsuits in the US in 2025. All three can be right, because they count different things: Seyfarth counts federal website cases only, EcomBack counts website cases from federal and state records, and UsableNet adds state courts in New York and California plus apps and video. Every tracker agrees on the direction: filings rose in 2025, most targeted ecommerce, and accessibility widgets did not stop them.',
      },
      {
        type: 'p',
        text: "If you've searched for ADA website lawsuit statistics, you've seen numbers that don't agree. Vendor pages tend to quote whichever figure suits their pitch. This post lines up the three main trackers, explains why their counts differ, and pulls out what they agree on, which is the part that should shape what you do.",
      },
      { type: 'tip', text: 'This post is general information, not legal advice. Talk to a lawyer about your own situation.' },

      { type: 'h2', text: 'The evidence at a glance' },
      {
        type: 'table',
        caption: 'The figures this article draws on, and where each comes from',
        head: ['Finding', 'Figure', 'Source'],
        rows: [
          ['Federal website accessibility lawsuits, 2025', '3,117 (+27% from 2,452)', 'Seyfarth Shaw, 2026'],
          ['Website suits as a share of all federal ADA Title III suits', '36% (3,117 of 8,667)', 'Seyfarth Shaw, 2026'],
          ['ADA website lawsuits, 2025', '3,948', 'EcomBack, 2026'],
          ['Digital accessibility lawsuits, federal + NY/CA state courts', '5,114', 'UsableNet, 2025'],
          ['Share of 2025 filings against ecommerce', '70%', 'UsableNet, 2025'],
          ['Federal filings against companies already sued', '45%', 'UsableNet, 2025'],
          ['Lawsuits against sites using accessibility widgets', '1,416 (UsableNet) · nearly 25% (EcomBack)', 'UsableNet; EcomBack'],
        ],
      },

      { type: 'h2', text: 'Why do the trackers report different numbers?' },
      { type: 'p', text: 'Each tracker draws a different boundary around "ADA website lawsuit."' },
      {
        type: 'table',
        caption: 'Sources: Seyfarth, 2026; EcomBack, 2026; UsableNet, 2025',
        head: ['Tracker', '2025 count', 'What it counts', 'What it leaves out'],
        rows: [
          ['Seyfarth Shaw (law firm)', '3,117', 'Federal ADA Title III lawsuits about websites, found by keyword search of Courthouse News Service data and checked by hand', 'State court cases and demand letters'],
          ['EcomBack (accessibility vendor)', '3,948', 'ADA website lawsuits from PACER, CourtLink and state court portals, January–December 2025', 'No federal/state split published'],
          ['UsableNet (accessibility vendor)', '5,114', 'Digital accessibility lawsuits (websites, mobile apps, video) in federal courts nationwide plus New York and California state courts, January 1–December 15, 2025', 'Other state courts; demand letters'],
        ],
      },
      {
        type: 'p',
        text: "The biggest difference is state courts. UsableNet counted 3,195 federal cases, close to Seyfarth's 3,117, plus 1,919 cases in New York and California state courts. Seyfarth deliberately excludes state courts and notes that a significant number of demand letters and state lawsuits fall outside its count (Seyfarth, 2026).",
      },
      {
        type: 'p',
        text: "So none of these numbers is the full picture. Demand letters, which often settle before any lawsuit is filed, aren't counted by anyone.",
      },

      { type: 'h2', text: 'What do all the trackers agree on?' },
      { type: 'h3', text: '1. Filings went up in 2025' },
      {
        type: 'p',
        text: "Seyfarth's federal count rose 27%, from 2,452 in 2024 to 3,117 in 2025. Website cases made up 36% of all federal ADA Title III lawsuits, up from 28% the year before (Seyfarth, 2026).",
      },
      { type: 'h3', text: '2. A few states account for most federal cases' },
      {
        type: 'p',
        text: "In Seyfarth's 2025 federal data, New York had 1,021 filings, Florida 961 (nearly double its 470 in 2024) and Illinois 585. California had only 4 federal filings, because California plaintiffs usually file in state court (Seyfarth, 2026).",
      },
      { type: 'h3', text: '3. Ecommerce is the main target' },
      {
        type: 'p',
        text: '70% of the 2025 filings UsableNet tracked were against ecommerce businesses, and 36% of the top 500 ecommerce retailers received at least one lawsuit (UsableNet, 2025).',
      },
      { type: 'h3', text: '4. Small businesses get sued too' },
      {
        type: 'p',
        text: "Companies with over $25 million in annual revenue were the target in 36% of UsableNet's cases. That means most cases targeted smaller businesses (UsableNet, 2025).",
      },
      { type: 'h3', text: "5. Being sued once doesn't stop the next suit" },
      {
        type: 'p',
        text: '1,427 federal cases, 45% of federal filings, targeted companies that had already been sued (UsableNet, 2025). Settling one case without fixing the site leaves the door open.',
      },
      { type: 'h3', text: '6. A small group of plaintiffs files most cases' },
      {
        type: 'p',
        text: "In EcomBack's data, 33 plaintiffs filed more than half of all 2025 lawsuits. Across all filings, 251 plaintiffs and 40 law firms were involved (EcomBack, 2026).",
      },
      { type: 'h3', text: "7. Accessibility widgets didn't prevent lawsuits" },
      {
        type: 'p',
        text: 'UsableNet counted 1,416 lawsuits against companies using accessibility widgets in 2025 (UsableNet, 2025). EcomBack found nearly 25% of lawsuits targeted sites with such tools and concluded they proved ineffective at preventing litigation (EcomBack, 2026). In 2025 the US Federal Trade Commission also finalised a $1 million order against overlay vendor accessiBe over claims that its tool could make sites compliant.',
      },

      { type: 'h2', text: 'What problems do these lawsuits usually cite?' },
      {
        type: 'p',
        text: 'Most complaints describe barriers a screen-reader or keyboard user hits on a real page. The WebAIM Million 2026 shows how common those barriers are: 95.9% of the top million home pages had detectable WCAG failures, with low-contrast text on 83.9%, missing image alt text on 53.1% and missing form labels on 51% (WebAIM, 2026).',
      },
      {
        type: 'p',
        text: 'The good news is that these are among the most fixable problems on the web. Most are detectable by automated testing, and many take minutes to fix once found.',
      },

      { type: 'h2', text: 'What should a site owner do?' },
      {
        type: 'list',
        ordered: true,
        items: [
          { lead: 'Audit your key pages now.', text: 'Start with the homepage, product or pricing pages, and sign-up or checkout. Fix contrast, labels, alt text and keyboard access first.' },
          { lead: 'Test with a real browser and a keyboard.', text: 'Tab through every page. Check that focus is always visible and never hidden behind sticky headers or banners.' },
          { lead: "Don't rely on a widget.", text: 'The data shows sites with overlays are still sued. Fix the underlying code instead.' },
          { lead: "Fix, don't just settle.", text: 'Nearly half of federal filings hit companies already sued. A settlement without fixes invites the next case.' },
          { lead: 'Re-audit after every release.', text: 'New features and content can bring new barriers.' },
          {
            lead: 'Get expert help for high-risk sites.',
            text: 'If you run a large ecommerce site or have received a demand letter, combine automated testing with a manual accessibility audit and legal advice.',
          },
        ],
      },

      { type: 'h2', text: 'How ProCurveUX helps' },
      {
        type: 'p',
        text: 'ProCurveUX checks your live pages against WCAG 2.2 AA rules alongside UX and conversion checks. It loads each page in a real browser on desktop and mobile, tabs through it, and flags issues such as low contrast, missing labels, invisible focus and focus hidden behind sticky elements. Every finding includes a screenshot, CSS selector and fix, ranked by impact.',
      },
      {
        type: 'tip',
        text: "Automated testing finds many issues but can't confirm full WCAG conformance. ProCurveUX is a fast first pass, not a legal compliance certificate.",
      },

      { type: 'h2', text: 'Key takeaways' },
      {
        type: 'list',
        items: [
          '2025 ADA website lawsuit counts range from 3,117 (Seyfarth, federal only) to 3,948 (EcomBack) to 5,114 (UsableNet, federal plus NY/CA state courts).',
          "The gap comes mainly from state courts and scope (websites only vs apps and video). Demand letters aren't counted by anyone.",
          'Federal website filings rose 27% in 2025 and made up 36% of all federal ADA Title III suits.',
          '70% of filings targeted ecommerce, and 45% of federal filings hit companies already sued.',
          "Accessibility widgets didn't prevent lawsuits: UsableNet counted 1,416 cases against sites using them.",
          'The barriers cited are common and fixable: 95.9% of home pages have detectable WCAG failures.',
        ],
      },

      { type: 'h2', text: 'Frequently asked questions' },
      {
        type: 'faq',
        items: [
          {
            q: 'How many ADA website lawsuits were filed in 2025?',
            a: 'Between 3,117 and 5,114, depending on the tracker. Seyfarth counted 3,117 in federal court. UsableNet counted 5,114 across federal courts and New York and California state courts.',
          },
          {
            q: 'Why are the numbers different?',
            a: 'The trackers use different scopes. Seyfarth counts federal website cases only. UsableNet adds state courts and apps. None counts demand letters.',
          },
          {
            q: 'Can small businesses be sued?',
            a: "Yes. In UsableNet's data, companies with over $25 million in revenue were the target in only 36% of cases.",
          },
          {
            q: 'Do accessibility widgets or overlays protect against lawsuits?',
            a: 'The evidence says no. UsableNet counted 1,416 lawsuits against sites using widgets in 2025, and EcomBack found nearly a quarter of lawsuits targeted sites using them.',
          },
          {
            q: 'Is an automated scan enough to be ADA compliant?',
            a: 'No. Automated tools catch many common issues, but full conformance needs manual testing too. Treat a scan as a starting point.',
          },
        ],
      },
    ],
    sources: [
      {
        title: 'Federal Court Website Accessibility Lawsuit Filings Bounce Back in 2025',
        publisher: 'Seyfarth Shaw LLP (Kristina M. Launey and Minh N. Vu), ADA Title III News & Insights',
        note: 'March 25, 2026',
        url: 'https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/',
      },
      {
        title: '2025 Year-End Digital Accessibility Lawsuit Report',
        publisher: 'UsableNet',
        note: 'data January 1–December 15, 2025; the 1,416 widget figure is the total of its monthly chart',
        url: 'https://info.usablenet.com/2025-year-end-report-on-web-accessibility-lawsuits',
      },
      {
        title: '2025 Website Accessibility Lawsuits Report: 3,948 Businesses Face ADA Legal Action',
        publisher: 'EcomBack, via ABNewswire',
        note: 'February 6, 2026',
        url: 'https://business.mammothtimes.com/mammothtimes/article/abnewswire-2026-2-6-ecomback-releases-2025-website-accessibility-lawsuits-report-3948-businesses-face-ada-legal-action',
      },
      {
        title: 'FTC Approves Final Order Requiring accessiBe to Pay $1 Million',
        publisher: 'US Federal Trade Commission',
        note: 'April 22, 2025',
        url: 'https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million',
      },
      {
        title: 'The WebAIM Million: The 2026 report on the accessibility of the top 1,000,000 home pages',
        publisher: 'WebAIM',
        note: 'February 2026 data',
        url: 'https://webaim.org/projects/million/',
      },
    ],
    cta: {
      title: 'Find the accessibility barriers on your site before someone else does',
      text: 'Paste your URL into ProCurveUX for a free audit, with WCAG 2.2 AA checks in a real browser and a ranked fix list in about a minute.',
    },
  },
  {
    slug: 'why-visitors-dont-convert',
    title: "Why visitors don't convert: 9 UX causes",
    seoTitle: "Why Visitors Don't Convert: 9 UX Causes, Backed by Data",
    description:
      'Hard-to-read copy, weak mobile pages, surprise costs and long forms: nine UX reasons landing pages lose visitors, the data behind each, and what to check.',
    date: '2026-11-06',
    category: 'Conversion',
    tags: ['Conversion rate', 'Landing pages', 'Mobile UX'],
    author: 'muhammad-babar',
    cover: 'conversion',
    body: [
      {
        type: 'answer',
        text: "Most landing pages lose visitors for a handful of fixable reasons: copy that's hard to read, too many words, a weaker mobile experience, slow loading, broken interactions, surprise costs, forced sign-ups, long forms and accessibility barriers. Across 41,000+ landing pages, pages written at a 5th–7th grade reading level converted at 11.1%, more than double the 5.3% for professional-level writing (Unbounce). Each cause below maps to something you can check and fix on your own page.",
      },
      { type: 'p', text: "You're getting the clicks. You're just not getting the customers. Analytics tells you where people leave, but not why." },
      {
        type: 'p',
        text: "The good news is that the reasons repeat across sites. Large datasets from Unbounce (41,000+ landing pages), Contentsquare (99 billion sessions) and Baymard Institute's checkout research point to the same small set of problems. This post lists nine of them, the evidence behind each, and what to check on your own page.",
      },

      { type: 'h2', text: 'The evidence at a glance' },
      {
        type: 'table',
        caption: 'The figures this article draws on, and where each comes from',
        head: ['Finding', 'Figure', 'Source'],
        rows: [
          ['Median landing page conversion rate', '6.6%', 'Unbounce, 2024'],
          ['Conversion rate at a 5th–7th grade reading level vs professional level', '11.1% vs 5.3%', 'Unbounce, 2024'],
          ['Share of landing page visits on mobile', '83%', 'Unbounce, 2024'],
          ['Year-on-year change in conversion rate', '−5.1%', 'Contentsquare, 2026'],
          ['Sessions affected by frustration', '35.2%', 'Contentsquare, 2026'],
          ['Change in API errors, year on year', '+16%', 'Contentsquare, 2026'],
          ['Shoppers who abandon checkout over extra costs', '40%', 'Baymard'],
          ['Home pages with detected WCAG failures', '95.9%', 'WebAIM Million, 2026'],
        ],
      },

      { type: 'h2', text: 'What counts as a good conversion rate?' },
      {
        type: 'p',
        text: "Unbounce's Conversion Benchmark Report analysed over 41,000 landing pages, 464 million visitors and 57 million conversions. The median conversion rate across all industries was 6.6%, and industry medians ranged from 3.8% to 12.3% (Unbounce, 2024).",
      },
      {
        type: 'p',
        text: "Conversion is also getting harder. Contentsquare's 2026 benchmark, covering 99 billion sessions on 6,500+ sites, found conversion rates fell 5.1% between Q4 2024 and Q4 2025 (Contentsquare, 2026).",
      },
      { type: 'p', text: "If your page sits below your industry's median, one or more of the causes below is usually the reason." },

      { type: 'h2', text: 'The 9 UX causes' },
      { type: 'h3', text: '1. Your copy is too hard to read' },
      {
        type: 'p',
        text: "This is the single strongest finding in Unbounce's data. Pages written at a 5th–7th grade reading level converted at 11.1%, 56% higher than pages at an 8th–9th grade level. Professional-level writing converted at just 5.3%. Difficult words (three or more syllables) had a −24.3% correlation with conversion rate, and that link has grown 62% stronger since 2020 (Unbounce, 2024).",
      },
      { type: 'p', text: 'Financial services was the one industry where more complex language helped.' },
      { type: 'tip', label: 'Check:', text: 'Run your headline and first paragraph through a free readability checker. Replace jargon with the words your customers use.' },

      { type: 'h3', text: "2. You're using too many words" },
      {
        type: 'p',
        text: 'Length hurts too. In the same dataset, word count had a −18.6% correlation with conversion rate, and reading time −19.4% (Unbounce, 2024). Every extra paragraph is another chance for a visitor to lose the thread before they reach your call to action.',
      },
      { type: 'tip', label: 'Check:', text: "Can a visitor understand what you offer, who it's for and what to do next within the first screen?" },

      { type: 'h3', text: '3. Your mobile experience is weaker than desktop' },
      {
        type: 'p',
        text: 'Mobile now accounts for 83% of landing page visits, nearly five times more than desktop, yet desktop still converts 8% better. Unbounce estimates mobile optimisation could have produced over 1.3 million more conversions across its dataset (Unbounce, 2024).',
      },
      {
        type: 'p',
        text: 'Performance is part of the gap. Only 62% of mobile sites load their main content within 2.5 seconds, against 74% on desktop. Only 45% of mobile home pages pass all Core Web Vitals (HTTP Archive, 2025).',
      },
      { type: 'tip', label: 'Check:', text: "Open your page on a phone. Is the main button reachable with your thumb? Does anything cover it? Do tap targets meet WCAG 2.5.8's 24×24px minimum?" },

      { type: 'h3', text: '4. The page loads too slowly' },
      {
        type: 'p',
        text: "Slow pages are improving but still common. In Contentsquare's 2026 data, slow page loads affected 10.9% of sessions, down 20% year on year (Contentsquare, 2026). On mobile, the median page spends 1,916 milliseconds with its main thread blocked, up 58% from 2024 (HTTP Archive, 2025).",
      },
      { type: 'tip', label: 'Check:', text: 'Test the page with Google PageSpeed Insights. Look first at your hero image, fonts and third-party scripts.' },

      { type: 'h3', text: '5. Things break when people try to use them' },
      {
        type: 'p',
        text: "Frustration is widespread. 35.2% of sessions showed signs of frustration in Contentsquare's 2026 benchmark. API errors, where something fails behind the scenes, rose 16% year on year, and rage clicks rose 1.5% (Contentsquare, 2026).",
      },
      {
        type: 'p',
        text: "These problems are invisible in a screenshot or design file. A form that won't submit, a filter that doesn't respond, or a button that does nothing only shows up when someone uses the page.",
      },
      { type: 'tip', label: 'Check:', text: 'Click every button and submit every form on your key pages, on both desktop and mobile.' },

      { type: 'h3', text: '6. Costs appear too late' },
      {
        type: 'p',
        text: "For ecommerce, surprise costs are the biggest single reason shoppers leave. In Baymard's research, 40% abandoned checkout because of extra costs such as shipping, taxes or fees (Baymard). The same applies to SaaS pricing that hides the real cost until the last step.",
      },
      { type: 'tip', label: 'Check:', text: 'Show the full price, including shipping or required add-ons, before the final step.' },

      { type: 'h3', text: '7. You force people to create an account' },
      {
        type: 'p',
        text: "18% of shoppers in Baymard's research dropped out when forced to create an account (Baymard). For SaaS, the equivalent is a long sign-up form before anyone sees the product.",
      },
      { type: 'tip', label: 'Check:', text: 'Offer guest checkout, or let people try the product before asking for details.' },

      { type: 'h3', text: '8. Your forms are too long or confusing' },
      {
        type: 'p',
        text: '17% abandoned because the checkout process felt too long or complicated (Baymard). Labelling makes it worse: 53% of desktop and 55% of mobile form inputs rely only on placeholder text for their label, which disappears as soon as someone starts typing (HTTP Archive, 2025).',
      },
      { type: 'tip', label: 'Check:', text: "Remove every field you don't strictly need. Give every field a visible label." },

      { type: 'h3', text: '9. Accessibility barriers block real customers' },
      {
        type: 'p',
        text: "Accessibility problems are conversion problems. The WebAIM Million 2026 found detectable WCAG failures on 95.9% of the top million home pages. Low-contrast text appeared on 83.9% of pages and missing form labels on 51% (WebAIM, 2026). If someone can't read your button or understand your form, they can't convert.",
      },
      { type: 'tip', label: 'Check:', text: 'Test colour contrast, form labels and keyboard navigation on your key pages.' },

      { type: 'h2', text: 'Which cause should you fix first?' },
      { type: 'p', text: 'Start with the problems that are both common and cheap to fix, then work towards the bigger changes.' },
      {
        type: 'table',
        caption: 'The nine causes, cheapest to fix first',
        head: ['Cause', 'Typical effort', 'Where it hurts most'],
        rows: [
          ['Hard-to-read copy', 'Low', 'Hero, headlines, CTA'],
          ['Too many words', 'Low', 'Landing pages'],
          ['Accessibility barriers', 'Low to medium', 'Forms, buttons, text'],
          ['Long or confusing forms', 'Low to medium', 'Sign-up, checkout'],
          ['Forced account creation', 'Medium', 'Checkout, sign-up'],
          ['Surprise costs', 'Medium (often a business decision)', 'Pricing, checkout'],
          ['Broken interactions', 'Medium', 'Forms, filters, menus'],
          ['Weak mobile experience', 'Medium to high', 'Every page'],
          ['Slow loading', 'Medium to high', 'Every page'],
        ],
      },
      { type: 'p', text: 'The effort ratings are general guidance, not measured figures. Your own audit will tell you which causes actually apply to your page.' },

      { type: 'h2', text: 'How ProCurveUX helps' },
      { type: 'p', text: 'ProCurveUX checks a live page for most of these causes in about a minute:' },
      {
        type: 'list',
        items: [
          'Readability, CTA prominence and visual hierarchy on the rendered page.',
          'Mobile problems at a real 390px width, including tap targets and sticky elements that cover the main action.',
          'Speed and stability, measured as Core Web Vitals while the page loads.',
          'Form and accessibility issues such as missing labels, low contrast and keyboard traps.',
          'Fixes ranked by your goal, so a sign-up page and a checkout page get different priorities.',
        ],
      },
      { type: 'p', text: 'Some causes need a person. Pricing decisions, copy tone and multi-step flows are flagged for your review rather than guessed at.' },

      { type: 'h2', text: 'Key takeaways' },
      {
        type: 'list',
        items: [
          'The median landing page converts at 6.6%, and conversion rates fell 5.1% year on year (Unbounce; Contentsquare).',
          'Simple copy wins: 5th–7th grade reading level pages converted at 11.1% vs 5.3% for professional-level writing.',
          '83% of landing page visits are on mobile, yet desktop still converts 8% better.',
          '35.2% of sessions show frustration, and API errors rose 16% year on year.',
          'In ecommerce, extra costs (40%), forced accounts (18%) and complicated checkouts (17%) drive abandonment (Baymard).',
          '95.9% of home pages have detectable accessibility failures, and each one can block a customer.',
        ],
      },

      { type: 'h2', text: 'Frequently asked questions' },
      {
        type: 'faq',
        items: [
          {
            q: 'Why is my landing page not converting?',
            a: 'The most common causes are hard-to-read copy, too many words, a weak mobile experience, slow loading, broken interactions, surprise costs, forced sign-ups, long forms and accessibility barriers. An audit of your live page shows which apply.',
          },
          {
            q: 'What is a good landing page conversion rate?',
            a: 'Across 41,000+ pages, Unbounce found a median of 6.6%, with industry medians from 3.8% to 12.3%. Compare yourself with your own industry, not the overall figure.',
          },
          {
            q: 'Does mobile really convert worse than desktop?',
            a: 'On average, yes. Unbounce found desktop converts 8% better even though mobile drives 83% of visits. Financial services and SaaS bucked the trend.',
          },
          {
            q: 'How do I find out why visitors leave?',
            a: 'Analytics shows where they leave, and session recordings show what they do. A UX audit explains why, by checking the page against known usability, accessibility and conversion rules.',
          },
          {
            q: 'Can a UX audit fix pricing problems?',
            a: 'It can show that costs appear too late, but the pricing decision itself is a business call.',
          },
        ],
      },
    ],
    sources: [
      {
        title: 'Conversion Benchmark Report',
        publisher: 'Unbounce',
        note: '2024 edition (41,000+ landing pages, 464M+ visitors, 57M+ conversions)',
        url: 'https://unbounce.com/conversion-benchmark-report/',
      },
      {
        title: '2026 Digital Experience Benchmarks',
        publisher: 'Contentsquare',
        note: '99 billion sessions, 6,500+ websites, Q4 2024 vs Q4 2025',
        url: 'https://contentsquare.com/guides/digital-experience-benchmark/',
      },
      {
        title: '2026 Digital Experience Benchmarks: Frustration',
        publisher: 'Contentsquare',
        url: 'https://contentsquare.com/guides/digital-experience-benchmark/frustration/',
      },
      {
        title: 'Cart Abandonment Rate: 50 Statistics & Why People Abandon (2026)',
        publisher: 'Baymard Institute',
        note: 'updated October 28, 2026',
        url: 'https://baymard.com/lists/cart-abandonment-rate',
      },
      {
        title: 'Web Almanac 2025, Performance and Accessibility chapters',
        publisher: 'HTTP Archive',
        note: 'published January 15, 2026',
        url: 'https://almanac.httparchive.org/en/2025/',
      },
      {
        title: 'The WebAIM Million: The 2026 report on the accessibility of the top 1,000,000 home pages',
        publisher: 'WebAIM',
        note: 'February 2026 data',
        url: 'https://webaim.org/projects/million/',
      },
    ],
    cta: {
      title: "Find out why your visitors don't convert",
      text: 'Paste your URL into ProCurveUX for a free audit and get a ranked fix list in about a minute.',
    },
  },
  {
    slug: 'screenshot-vs-real-browser-ux-audit',
    title: 'Screenshot vs. real browser: what UX tools miss',
    seoTitle: 'Screenshot vs Real Browser UX Audits: What Static Tools Miss',
    description:
      "Screenshot-based UX tools found just 14% of live-page issues in Baymard's test. See the hover, focus, layout-shift and mobile problems only a real browser catches.",
    date: '2026-11-06',
    category: 'UX audits',
    tags: ['Real-browser testing', 'AI UX audits', 'Core Web Vitals'],
    author: 'muhammad-babar',
    cover: 'browser',
    body: [
      {
        type: 'answer',
        text: "A screenshot shows how a page looks, not how it behaves. In Baymard's test, an AI reviewing screenshots found 26% of the issues visible in the image but only 14% of the issues present on the live page. Hover states, keyboard focus, layout shift, interaction speed and touch-only problems can only be found by loading and using the page in a real browser.",
      },
      {
        type: 'p',
        text: 'Ask most AI UX tools to review your site and they do one of two things. They take a screenshot and ask a model what it sees, or they read your HTML and check it against rules. Both are fast and cheap, and both miss a whole class of problems.',
      },
      {
        type: 'p',
        text: "Those problems are the ones users actually feel: the menu that won't open on a phone, the button that jumps away just as you tap it, the focus ring hidden behind a sticky header. This post explains what each kind of tool can and can't see, and how to tell which one you're using.",
      },

      { type: 'h2', text: 'The evidence at a glance' },
      {
        type: 'table',
        caption: 'The figures this article draws on, and where each comes from',
        head: ['Finding', 'Figure', 'Source'],
        rows: [
          ['Issues on a live page found by AI reviewing screenshots', '14%', 'Baymard, 2023'],
          ['Accuracy of AI UX tools tested in 2025', '50–75%', 'Microsoft UX researchers, via Baymard, 2026'],
          ["Sites that remove the browser's default focus outline", '67%', 'Web Almanac, 2025'],
          ['Sites using the more accessible :focus-visible', '25%', 'Web Almanac, 2025'],
          ['Mobile pages with at least one image missing dimensions (a layout-shift risk)', '62%', 'Web Almanac, 2025'],
          ['Mobile pages with non-composited animations', '40%', 'Web Almanac, 2025'],
          ['Mobile sites with good INP vs desktop', '77% vs 97%', 'Web Almanac, 2025'],
          ['Home pages passing Core Web Vitals on mobile vs secondary pages', '45% vs 56%', 'Web Almanac, 2025'],
        ],
      },
      {
        type: 'p',
        text: 'Every item in that table describes something that happens while a page loads or is used. None of it is visible in a still image.',
      },

      { type: 'h2', text: 'How do UX audit tools actually analyse a page?' },
      { type: 'p', text: 'There are three main approaches. Most tools use one; a few combine them.' },
      {
        type: 'table',
        caption: 'The three ways UX tools analyse a page',
        head: ['Method', 'What the tool sees', 'Good at', 'Blind to'],
        rows: [
          ['Screenshot analysis', 'A flat image of the page at one moment', 'Visual hierarchy, layout, obvious contrast problems, design reviews of mockups', 'Anything that moves, responds, loads late or depends on interaction'],
          ['Static code scan', 'The HTML source, sometimes before scripts run', 'Missing labels, alt text, heading structure, ARIA errors', 'Rendered layout, real colours after CSS, timing, behaviour'],
          ['Real-browser testing', 'The fully rendered page, loaded and used like a visitor would', 'Everything above, plus hover, focus, keyboard, layout shift, speed and mobile behaviour', 'Brand fit, copy tone, multi-page task flows (these need a human)'],
        ],
      },
      {
        type: 'p',
        text: "The difference isn't just technical. It decides which of your users' problems ever show up in the report.",
      },

      { type: 'h2', text: 'What does the evidence say about screenshot-based audits?' },
      {
        type: 'p',
        text: 'The clearest test comes from Baymard Institute. In 2023, they uploaded screenshots of 12 ecommerce pages (from Lego, REI, Zalando, Expedia and others) to GPT-4 and asked what UX improvements could be made. They then compared its 178 suggestions line by line with 257 issues found by six trained UX benchmarkers who used the live sites (Baymard, 2023).',
      },
      {
        type: 'table',
        caption: "GPT-4 reviewing screenshots, compared with UX benchmarkers using the live sites (Baymard, 2023)",
        head: ['Measure', 'Result'],
        rows: [
          ['Issues found that were visible in the screenshot', '25.5%'],
          ['Issues found that were present on the live page', '14.1%'],
          ["Accuracy of GPT-4's suggestions", '19.9%'],
          ['False-positive error rate', '80.1%'],
          ['Issues overlooked per live page (average)', '18.5'],
        ],
      },
      {
        type: 'p',
        text: "The gap between 26% and 14% is the part that matters here. Even if the AI had been perfect at reading the image, it could never have found the issues that only appear when you interact with the page. Baymard's conclusion was that many UX issues require clicking buttons, hovering images and moving between pages to discover.",
      },
      {
        type: 'p',
        text: "This is a property of the method, not of one model. A better model reading a better screenshot still can't see a hover state that never happened.",
      },
      {
        type: 'p',
        text: "Newer tools haven't closed the gap. In March 2025, two Microsoft UX researchers tested AI tools on heuristic evaluations and found accuracy rates of 50%, 62%, 67% and 75%. The best score came from a tool set to report far fewer issues: it missed 13 of the 16 problems a human expert found on the same page (Baymard, 2026).",
      },
      {
        type: 'p',
        text: 'Even rule-based scanners have limits. The 2025 Web Almanac points to a GOV.UK comparison of popular automated accessibility tools, all of which detected fewer than 50% of known errors (HTTP Archive, 2025).',
      },

      { type: 'h2', text: 'Six problems only a real browser can find' },
      { type: 'h3', text: '1. Hover and interactive states' },
      {
        type: 'p',
        text: "Buttons, links and cards should change when a user hovers, taps or focuses on them. That feedback tells people an element is clickable. A screenshot captures the resting state only, so it can't tell whether an element responds at all. Hover-only menus are a related problem: they work with a mouse and fail completely on a touch screen.",
      },
      { type: 'h3', text: '2. Invisible keyboard focus' },
      {
        type: 'p',
        text: 'Keyboard users, and many power users, move through a page with the Tab key. WCAG 2.4.7 (Focus Visible) requires a visible indicator showing where focus is. Many sites remove the default focus outline for visual reasons and never replace it. The only way to test this is to tab through the page and watch.',
      },
      {
        type: 'p',
        text: "This is common. In 2025, 67% of sites explicitly removed the default focus outline with `:focus { outline: 0 }`, up 14% from 2024. Only about a quarter used `:focus-visible`, the modern way to show focus only when it's needed (HTTP Archive, 2025). Removing the outline isn't always a failure, since a site may add its own style. But you can only confirm that by tabbing through the page. The Web Almanac's authors note that automated tools like Lighthouse are limited on keyboard traps, focus order and whether focus moves logically to new content.",
      },
      { type: 'h3', text: '3. Focus hidden behind sticky elements' },
      {
        type: 'p',
        text: 'WCAG 2.2 added criterion 2.4.11, Focus Not Obscured (Minimum). It fails when a sticky header, chat widget or cookie banner covers the element a user has tabbed to. The page looks fine in a screenshot. It only breaks when focus moves under the sticky element, which a static tool never triggers.',
      },
      { type: 'h3', text: '4. Layout shift' },
      {
        type: 'p',
        text: "Layout shift happens when content moves after it first appears: a late-loading banner pushes text down, or a web font swaps in and reflows a heading. Users tap the wrong thing or lose their place. It's measured as Cumulative Layout Shift (CLS), where 0.1 or less counts as good. A finished screenshot shows the page after everything settles, so the shift is invisible.",
      },
      {
        type: 'p',
        text: "The 2025 Web Almanac found 81% of mobile sites have good CLS, which means roughly one in five still don't (HTTP Archive, 2025).",
      },
      {
        type: 'p',
        text: 'Desktop is worse: only 72% of desktop pages have good CLS. The causes are well known, and all of them are invisible in a finished screenshot (HTTP Archive, 2025):',
      },
      {
        type: 'table',
        caption: 'Common causes of layout shift, and how often they appear on mobile pages (HTTP Archive, 2025)',
        head: ['Layout-shift cause', 'How common (mobile, 2025)'],
        rows: [
          ['Pages with at least one image missing width and height', '62%'],
          ['Pages using at least one web font', '87%'],
          ['Pages preloading fonts to avoid a swap', '15–16%'],
          ['Pages with non-composited animations', '40%'],
        ],
      },
      { type: 'h3', text: '5. Slow responses to taps and clicks' },
      {
        type: 'p',
        text: 'Interaction to Next Paint (INP) measures how long a page takes to visibly respond after a user acts. 200 milliseconds or less is good. Heavy menus, filters and forms often fail on phones. In 2025, 77% of mobile sites had good INP (HTTP Archive, 2025). INP only exists when someone interacts, so neither a screenshot nor a code scan can measure it.',
      },
      {
        type: 'p',
        text: 'The gap between devices is large. 97% of desktop sites have good INP, compared with 77% on mobile. Deeper pages fare worse: only 69% of mobile secondary pages, where filters, carousels and form validation live, have good INP. The median mobile page also spends 1,916 milliseconds with its main thread blocked, up 58% from 2024 (HTTP Archive, 2025).',
      },
      { type: 'h3', text: '6. Mobile-only breakage' },
      {
        type: 'p',
        text: "A desktop screenshot says nothing about a 390px phone screen. Real-browser testing at mobile width finds content that overflows, buttons smaller than WCAG 2.5.8's 24×24px minimum, and sticky bars that cover the main action. Overall, 48% of mobile sites pass all three Core Web Vitals, compared with 56% on desktop (HTTP Archive, 2025).",
      },
      {
        type: 'p',
        text: 'Mobile problems pile up fastest on the pages that matter most. Only 45% of mobile home pages pass Core Web Vitals, compared with 56% of mobile secondary pages. On mobile, 62% of sites load their main content within 2.5 seconds, against 74% on desktop (HTTP Archive, 2025). And 19% of mobile sites still block pinch-to-zoom, which makes them hard to use for people with low vision (HTTP Archive, 2025).',
      },
      {
        type: 'tip',
        label: 'Bonus: keyboard traps.',
        text: 'A modal or menu that lets keyboard users tab in but not out (WCAG 2.1.2). Again, you only find it by trying.',
      },

      { type: 'h2', text: 'When is screenshot analysis still useful?' },
      { type: 'p', text: "Screenshots aren't useless. They're the right tool for some jobs:" },
      {
        type: 'list',
        items: [
          { lead: "Reviewing designs before they're built.", text: 'A Figma mockup has no live behaviour yet, so an image is all there is.' },
          { lead: 'Checking visual hierarchy.', text: 'Is the main call to action the most prominent thing on the page? A static view can answer that.' },
          {
            lead: 'Narrow, well-defined checks.',
            text: "Baymard's UX-Ray 2.0 analyses screenshots and live URLs with a documented 95% accuracy rate, measured against human auditors across 79 websites (Baymard, 2026). It gets there by limiting itself to specific, research-backed heuristics and not asking an AI to judge good or bad UX.",
          },
        ],
      },
      {
        type: 'p',
        text: 'The takeaway is not "never use screenshots." It\'s that screenshot analysis covers a subset of UX. If that\'s all your tool does, a large share of real problems will never reach your report.',
      },

      { type: 'h2', text: "How can you tell which kind of tool you're using?" },
      { type: 'p', text: 'Marketing pages rarely say how a tool works. Ask these five questions:' },
      {
        type: 'list',
        ordered: true,
        items: [
          { lead: 'Does it load my live URL, or analyse an uploaded image?', text: "If you can upload a screenshot and get the same report, it's screenshot-based." },
          { lead: 'Does it test at mobile width?', text: 'Look for a stated viewport, such as 390px wide, not just "mobile-friendly" claims.' },
          { lead: 'Does it interact with the page?', text: 'Look for keyboard (Tab) testing, hover checks and scrolling.' },
          { lead: 'Does it measure CLS and INP?', text: 'These require loading and using the page. A tool that reports them is running a real browser.' },
          {
            lead: 'Does it show evidence for each finding?',
            text: 'A screenshot of the exact element plus its CSS selector lets you check the finding yourself. Vague advice like "improve your hierarchy" can\'t be verified.',
          },
        ],
      },
      {
        type: 'tip',
        text: "If a tool can't answer yes to questions 1, 3 and 4, assume it can't see interaction problems.",
      },

      { type: 'h2', text: 'How ProCurveUX tests a live page' },
      {
        type: 'p',
        text: "ProCurveUX was built around real-browser testing because that's where the problems users feel actually live.",
      },
      { type: 'p', text: 'When you paste a URL:' },
      {
        type: 'list',
        ordered: true,
        items: [
          'The page loads in a real Chromium browser at two sizes: desktop (1440×900) and mobile (390×844).',
          { lead: "It's used like a visitor would use it.", text: 'ProCurveUX scrolls the page, hovers over interactive elements, tabs through with the keyboard and records Core Web Vitals as the page loads.' },
          "Every result is checked against 120+ rules from UX laws, Nielsen's 10 heuristics, visual design principles and WCAG 2.2 AA.",
          'Each finding comes with evidence: a screenshot with the element highlighted, its CSS selector and the pages it appears on.',
          "Fixes are ranked by your goal, whether that's sign-ups, demo bookings, checkout or support deflection.",
        ],
      },
      {
        type: 'p',
        text: "We're also clear about the limits. About two-thirds of our rules are tested automatically. The rest, such as brand fit, copy tone and multi-page task flows, are flagged for your review with a short checklist. (We cover this split in detail in [What can an automated UX audit really catch?](/blog/automated-ux-audit))",
      },

      { type: 'h2', text: 'Key takeaways' },
      {
        type: 'list',
        items: [
          'UX tools analyse pages in three ways: screenshots, static code scans or a real browser. Only a real browser sees how the page behaves.',
          "In Baymard's test, screenshot analysis found 26% of issues visible in the image but only 14% of those on the live page. AI tools tested in 2025 still scored only 50–75% accuracy.",
          '67% of sites remove the default focus outline, and only 25% use `:focus-visible`. Whether focus is still visible can only be checked by tabbing through the page.',
          '62% of mobile pages have at least one image without dimensions, a leading cause of layout shift that a screenshot never shows.',
          'Mobile INP lags desktop badly (77% vs 97% good), and only 45% of mobile home pages pass Core Web Vitals.',
          'Screenshots are still useful for design mockups and narrow visual checks.',
          'Before choosing a tool, ask whether it loads your live URL, tests at mobile width, interacts with the page and measures CLS and INP.',
        ],
      },

      { type: 'h2', text: 'Frequently asked questions' },
      {
        type: 'faq',
        items: [
          {
            q: 'Can AI do a UX audit from a screenshot?',
            a: "It can spot some visual issues, but it misses anything interactive. In Baymard's 2023 test, GPT-4 found only 14% of the issues present on live pages when working from screenshots.",
          },
          {
            q: 'What is the difference between a static scan and real-browser testing?',
            a: 'A static scan reads the page\'s code. Real-browser testing loads the page, renders it with all its styles and scripts, and interacts with it the way a visitor would. Only real-browser testing can measure behaviour, timing and layout shift.',
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
      },
    ],
    sources: [
      {
        title: "Testing ChatGPT-4 for 'UX Audits' Shows an 80% Error Rate & 14–26% Discoverability Rate",
        publisher: 'Baymard Institute',
        note: 'October 18, 2023',
        url: 'https://baymard.com/research-articles/gpt-ux-audit',
      },
      {
        title: 'AI Heuristic UX Evaluations with a 95% Accuracy Rate (Human-Level Accuracy)',
        publisher: 'Baymard Institute',
        note: "updated May 28, 2026 (includes Microsoft UX researchers' March 2025 tests)",
        url: 'https://baymard.com/research-articles/ai-heuristic-evaluations',
      },
      {
        title: 'Web Almanac 2025, Performance chapter',
        publisher: 'HTTP Archive',
        note: 'CrUX and HTTP Archive data, July 2025; published January 15, 2026',
        url: 'https://almanac.httparchive.org/en/2025/performance',
      },
      {
        title: 'Web Almanac 2025, Accessibility chapter',
        publisher: 'HTTP Archive',
        note: 'published January 15, 2026',
        url: 'https://almanac.httparchive.org/en/2025/accessibility',
      },
      {
        title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
        publisher: 'W3C',
        note: 'criteria 2.1.2, 2.4.7, 2.4.11 and 2.5.8',
        url: 'https://www.w3.org/TR/WCAG22/',
      },
    ],
    cta: {
      title: 'Test your site the way your users experience it',
      text: 'Paste your URL into ProCurveUX. It loads your page on desktop and mobile, interacts with it like a real visitor, and returns a ranked fix list in about a minute.',
    },
  },
  {
    slug: 'automated-ux-audit',
    title: 'What can an automated UX audit really catch?',
    description:
      'Automation reliably catches contrast, labels, tap targets and layout shift, but not brand fit, tone or task flows. Here is our rule-by-rule coverage map.',
    date: '2026-11-06',
    category: 'UX audits',
    tags: ['Automated testing', 'WCAG 2.2', 'AI UX audits'],
    author: 'muhammad-babar',
    cover: 'coverage',
    featured: true,
    body: [
      {
        type: 'answer',
        text: 'An automated UX audit can reliably catch measurable problems such as low contrast, missing labels, small tap targets, layout shift and slow interactions. It cannot judge brand fit, copy tone, or whether a multi-step flow makes sense for your users. At ProCurveUX, about two-thirds of our 120+ rules are checked automatically in a real browser. The rest are flagged for a human, with a short checklist. Any tool that claims 100% coverage is overselling.',
      },
      {
        type: 'p',
        text: "Most UX audit tools tell you what they found. Very few tell you what they couldn't check. That gap matters, because a clean report from a tool that skipped half the problems can be worse than no report at all.",
      },
      {
        type: 'p',
        text: "This guide maps exactly where automation is strong, where it needs a real browser, and where it still needs a person. It draws on Deque's study of nearly 300,000 accessibility issues, Baymard's tests of AI auditors, and the WebAIM Million 2026 report. We then show our own coverage map, rule by rule.",
      },

      { type: 'h2', text: 'The evidence at a glance' },
      {
        type: 'table',
        caption: 'The figures this guide draws on, and where each comes from',
        head: ['Finding', 'Figure', 'Source'],
        rows: [
          ['Accessibility issues fully covered by automated testing (by volume)', '57%', 'Deque, 2021'],
          ['WCAG criteria that can be fully tested automatically (commonly cited)', '20–30%', 'Deque, 2021'],
          ['Popular automated accessibility tools detecting known errors', 'Under 50% each', 'GOV.UK comparison, via Web Almanac 2025'],
          ['Detected errors falling into six machine-detectable categories', '96%', 'WebAIM Million, 2026'],
          ['Home pages with detected WCAG failures', '95.9%', 'WebAIM Million, 2026'],
          ['Accuracy of GPT-4 UX suggestions', '19.9%', 'Baymard, 2023'],
          ['Accuracy of AI UX tools tested in 2025', '50–75%', 'Microsoft UX researchers, via Baymard, 2026'],
          ['Sites removing the default focus outline (only verifiable by tabbing)', '67%', 'Web Almanac, 2025'],
        ],
      },

      { type: 'h2', text: 'How much can automation actually catch?' },
      { type: 'p', text: 'It depends on what you count. There are two honest answers, and they differ by more than double.' },
      {
        type: 'p',
        lead: 'Counting rules: 20–30%.',
        text: 'For years, the accepted figure was that automated testing covers only 20–30% of accessibility requirements. That figure counts WCAG success criteria: of all the rules in the standard, only a minority can be fully tested by software.',
      },
      {
        type: 'p',
        lead: 'Counting real issues: 57%.',
        text: 'In March 2021, Deque analysed over 2,000 audits covering more than 13,000 first-time page assessments and nearly 300,000 issues. Their automated testing fully covered 57% of the issues found, on average (Deque, 2021).',
      },
      {
        type: 'p',
        text: 'Both numbers are true. The gap exists because some problems are far more common than others. A missing label or a low-contrast button appears dozens of times on a page, and software catches every one. A confusing checkout flow appears once, and software misses it.',
      },
      {
        type: 'p',
        text: 'The WebAIM Million 2026 shows how lopsided this is. Across one million home pages, 96% of all detected errors fell into just six categories (WebAIM, 2026):',
      },
      {
        type: 'table',
        caption: 'The six most common accessibility errors on the top million home pages (WebAIM, 2026)',
        head: ['Error type', 'Home pages affected (2026)'],
        rows: [
          ['Low contrast text', '83.9%'],
          ['Missing image alt text', '53.1%'],
          ['Missing form labels', '51%'],
          ['Empty links', '46.3%'],
          ['Empty buttons', '30.6%'],
          ['Missing document language', '13.5%'],
        ],
      },
      {
        type: 'p',
        text: 'Every one of these is machine-detectable. That is why automation covers so much of what actually goes wrong, even though it covers a minority of the rules.',
      },
      {
        type: 'p',
        text: "A second large dataset agrees. The 2025 Web Almanac, which runs Lighthouse (powered by Deque's axe-core) across millions of sites, found only about 30% of sites pass minimum colour contrast, and that 53% of desktop and 55% of mobile inputs rely only on placeholder text for their label (HTTP Archive, 2025). Both problems are cheap to detect and cheap to fix, which is exactly where automation earns its keep.",
      },
      {
        type: 'tip',
        label: 'What this means for you:',
        text: 'When a tool quotes a coverage figure, ask which one it means. "57% of issues" and "30% of rules" describe the same tool.',
      },
      {
        type: 'p',
        text: "There's also a ceiling per tool. The Web Almanac's authors cite a GOV.UK comparison of popular automated accessibility tools: every one detected fewer than 50% of known errors. They add that a perfect Lighthouse score doesn't guarantee full accessibility and should be treated as a starting point (HTTP Archive, 2025).",
      },

      { type: 'h2', text: 'What do automated audits catch reliably?' },
      {
        type: 'p',
        text: 'Automation is strongest where a rule has a clear, measurable pass or fail. If you can write the test as a number or a yes/no check, software can run it on every element of every page, faster and more consistently than a person.',
      },
      {
        type: 'table',
        caption: 'Checks with a clear, measurable pass or fail',
        head: ['Issue type', "How it's measured", 'Example rule'],
        rows: [
          ['Colour contrast', 'Ratio between text and background colours', 'WCAG 1.4.3: 4.5:1 for normal text'],
          ['Missing labels and names', 'Does every input, button and link have an accessible name?', 'WCAG 1.3.1, 4.1.2'],
          ['Image alternatives', 'Does each meaningful image have alt text?', 'WCAG 1.1.1'],
          ['Tap target size', 'Width and height of interactive elements in CSS pixels', 'WCAG 2.5.8: at least 24×24px'],
          ['Heading structure', 'Are heading levels skipped? Is there one H1?', 'Common usability heuristic'],
          ['Layout shift', 'Cumulative Layout Shift (CLS) score while the page loads', 'Core Web Vitals: CLS ≤ 0.1'],
          ['Load and response speed', 'Largest Contentful Paint (LCP) and Interaction to Next Paint (INP)', 'LCP ≤ 2.5s, INP ≤ 200ms'],
          ['Visual consistency', 'Spacing, type sizes and button styles compared across the page', 'Design-system heuristics'],
          ['CTA prominence', 'Size, contrast and position of the primary action vs. competing actions', "Hick's Law, Fitts's Law"],
        ],
      },
      {
        type: 'p',
        text: "These checks have two things in common. The answer doesn't depend on your audience or brand, and the same input always gives the same result. That is what makes them safe to automate.",
      },
      {
        type: 'p',
        lead: 'One caution:',
        text: '"automatable" does not mean every tool does it well. Deque notes that its rules library puts heavy emphasis on not reporting false positives (Deque, 2021). A tool that floods you with false alarms is technically automated but practically useless.',
      },

      { type: 'h2', text: 'What can only be caught in a real browser?' },
      { type: 'p', text: 'Many UX problems only exist when someone uses the page. A screenshot or a code scan cannot see them.' },
      {
        type: 'p',
        text: "Baymard tested this directly in 2023. They gave GPT-4 screenshots of 12 ecommerce pages and compared its findings with six trained UX benchmarkers who used the live sites. GPT-4 found 26% of the issues visible in the screenshot, but only 14% of the issues actually present on the live page (Baymard, 2023). Baymard's explanation: a large share of UX issues are interactive, and can't be judged from an image.",
      },
      { type: 'p', text: 'Here is what a real browser can test that a screenshot cannot:' },
      {
        type: 'list',
        items: [
          { lead: 'Hover and focus states.', text: 'Does a button change when you hover or tab to it? Is the keyboard focus ring visible at all?' },
          { lead: 'Focus hidden behind sticky elements.', text: "WCAG 2.2 added criterion 2.4.11 (Focus Not Obscured). It fails when a sticky header or cookie banner covers the element you've tabbed to. You can only find this by tabbing through the page." },
          { lead: 'Layout shift.', text: 'A banner or font that loads late and pushes content down is invisible in a finished screenshot. It only shows up while the page is loading.' },
          { lead: 'Interaction speed.', text: 'INP measures how long the page takes to respond after a tap or click. It needs a real interaction to measure.' },
          { lead: 'Mobile-only problems.', text: "Menus that only open on hover fail on touch screens. Elements that overflow at a 390px width don't appear in a desktop capture." },
          { lead: 'Keyboard traps.', text: 'A modal or menu that you can tab into but not out of.' },
        ],
      },
      {
        type: 'p',
        text: "These aren't edge cases. In 2025, 67% of sites removed the browser's default focus outline, and only about 25% used :focus-visible (HTTP Archive, 2025). On mobile, 62% of pages had at least one image without set dimensions, a leading cause of layout shift, and 40% ran non-composited animations (HTTP Archive, 2025). Whether these actually hurt users can only be confirmed by loading and using the page.",
      },
      {
        type: 'tip',
        label: 'Why this matters for tool choice:',
        text: "If a tool works from a screenshot or a static code scan, it can't test any of the items above. Ask any audit tool whether it loads and interacts with your live page.",
      },

      { type: 'h2', text: 'What still needs a human?' },
      {
        type: 'p',
        text: 'Some UX questions have no fixed right answer. They depend on who your users are, what your brand stands for, and what you want people to do. These still need a person.',
      },
      {
        type: 'list',
        items: [
          { lead: 'Brand fit.', text: 'Does the design feel like your company? Software can measure contrast, not personality.' },
          { lead: 'Copy tone and clarity.', text: "Is the headline clear to your audience? Does the microcopy sound like you? Reading level can be scored, but meaning can't." },
          { lead: 'Task flows.', text: 'Can a first-time user sign up, find pricing, or complete checkout without getting lost? This depends on goals that span several pages.' },
          { lead: 'Content accuracy.', text: 'Are prices, claims and product details correct?' },
          { lead: 'Context-dependent choices.', text: 'Is infinite scroll right for this product list? Should this form be one step or three? The answer depends on the use case.' },
        ],
      },
      { type: 'h3', text: 'Why not just ask AI to judge these?' },
      {
        type: 'p',
        text: "Because the evidence says it isn't reliable yet. In Baymard's 2023 test, GPT-4 had a 19.9% accuracy rate and an 80.1% false-positive error rate. On average per page, it correctly found 2.9 issues, overlooked 18.5, made 1.3 suggestions likely to harm UX, and 10.6 that were a waste of time (Baymard, 2023).",
      },
      {
        type: 'p',
        text: 'Tools have improved since then, but not enough. In March 2025, two Microsoft UX researchers tested AI tools on heuristic evaluations and found accuracy rates of 50%, 62%, 67% and 75%. The 75% tool only reached that score by reporting far fewer issues. It missed 13 of the 16 problems the human expert found (Baymard, 2026).',
      },
      {
        type: 'p',
        text: "The real risk is that the wrong suggestions look just as confident as the right ones. Baymard gives an example: GPT-4 suggested Overstock replace pagination with infinite scrolling, a pattern their research shows hurts usability (Baymard, 2023). If you can't tell which suggestions are wrong, you can't safely act on any of them.",
      },
      {
        type: 'tip',
        label: 'The lesson:',
        text: 'Use automation for checks with clear right answers. Flag judgement calls for a human instead of letting a model guess.',
      },

      { type: 'h2', text: 'The ProCurveUX coverage map' },
      {
        type: 'p',
        text: "ProCurveUX checks every site against 120+ rules drawn from UX laws, Nielsen's 10 usability heuristics, visual design principles and WCAG 2.2 AA. About two-thirds of those rules are tested automatically. The rest are flagged for manual review, and every report says which is which.",
      },
      { type: 'p', text: 'We split the work into three layers:' },
      {
        type: 'table',
        caption: 'How ProCurveUX tests its 120+ rules',
        head: ['Layer', 'What it covers', "How it's tested", 'Examples'],
        rows: [
          ['1. Measured rules', 'Fixed pass/fail checks on every element', 'Computed from the rendered page', 'Contrast, labels, alt text, tap targets, heading structure'],
          ['2. Interaction-tested rules', 'Problems that only appear when the page is used', 'Real Chromium browser at 1440×900 and 390×844: scrolling, hovering and tabbing', 'Focus visibility, focus hidden by sticky headers, hover-only menus, layout shift, INP'],
          ['3. Human review', 'Judgement calls that depend on your brand, users and goals', 'Flagged in the report with a 20-minute checklist', 'Brand fit, copy tone, multi-page task flows'],
        ],
      },
      { type: 'p', text: 'Layers 1 and 2 together make up roughly two-thirds of our rules. Layer 3 is the remaining third.' },
      { type: 'p', text: 'Three design choices follow from this map:' },
      {
        type: 'list',
        ordered: true,
        items: [
          { lead: "We don't guess at Layer 3.", text: 'We would rather mark a rule "needs manual review" than produce a confident answer that might be wrong.' },
          { lead: 'Every finding shows its evidence.', text: 'Each issue comes with a screenshot, the CSS selector and the pages it appears on. You can verify it in seconds instead of trusting it blindly.' },
          { lead: 'Findings are ranked by your goal.', text: 'You choose sign-ups, demo bookings, checkout or support deflection, and each finding is weighted by how much it blocks that goal.' },
        ],
      },
      { type: 'p', text: 'We publish this split because a report is only as useful as your understanding of what it left out.' },

      { type: 'h2', text: 'What should a site owner do?' },
      { type: 'p', text: 'A simple routine gets you most of the value of a full audit at a fraction of the cost.' },
      {
        type: 'list',
        ordered: true,
        items: [
          { lead: 'Run an automated audit on your key pages.', text: 'Start with the homepage, pricing and sign-up or checkout. Fix the measured issues first; they are cheap, certain and often widespread.' },
          { lead: 'Check it in a real browser on mobile.', text: 'Use a tool that tests at a phone width and tabs through the page, or do it yourself: put your phone in your hand and try to complete your main task.' },
          { lead: 'Do the 20-minute human review.', text: 'Go through brand fit, copy clarity and your main task flow. Better still, watch one or two real users try it.' },
          { lead: 'Fix by impact, not by count.', text: 'One weak call-to-action on your pricing page costs more than ten minor contrast issues in the footer. Rank fixes by the goal you care about.' },
          { lead: 'Re-audit after every release.', text: "New features bring new problems. A quick re-run tells you what you fixed, what broke and what's new." },
          { lead: 'Bring in an expert for high-stakes changes.', text: 'For a redesign, a checkout rebuild or a compliance review, pair automated results with an experienced designer or accessibility specialist.' },
        ],
      },

      { type: 'h2', text: 'Key takeaways' },
      {
        type: 'list',
        items: [
          'Automated coverage depends on what you count. Deque found automation covers about 57% of real accessibility issues, but only 20–30% of WCAG rules.',
          "Six error types, all machine-detectable, account for 96% of detected accessibility errors on the web's top million home pages (WebAIM, 2026).",
          'Screenshots miss interaction problems. GPT-4 found 26% of issues in a screenshot but only 14% of those on the live page (Baymard, 2023).',
          'AI is not yet reliable for judgement calls. Published tests show accuracy of 20% (GPT-4, 2023) to 50–75% (AI tools, 2025).',
          'ProCurveUX automates about two-thirds of its 120+ rules in a real browser and flags the remaining third for human review.',
          'The safest audit combines automated checks, real-browser interaction testing and a short human review.',
        ],
      },

      { type: 'h2', text: 'Frequently asked questions' },
      {
        type: 'faq',
        items: [
          {
            q: 'Can an automated tool make my site fully WCAG compliant?',
            a: "No. Automated tools can find many failures, but they can't confirm full conformance. WebAIM notes that the absence of detected errors does not mean a page is accessible or conformant (WebAIM, 2026). Full compliance needs manual testing as well.",
          },
          {
            q: 'What percentage of UX issues can automation find?',
            a: "For accessibility, Deque's study found automation covered 57% of issues by volume. For broader UX, the share is lower, because more UX problems depend on context, content and user goals.",
          },
          {
            q: 'Is a screenshot-based AI audit good enough?',
            a: "It can surface some visual issues, but it misses anything interactive. In Baymard's test, screenshot analysis found only 14% of the issues present on live pages.",
          },
          {
            q: 'Why does ProCurveUX flag some rules instead of answering them?',
            a: 'Because a confident wrong answer is worse than an honest "check this yourself." Rules about brand, tone and task flows depend on your users, so we mark them for review and give you a checklist.',
          },
          {
            q: 'How often should I run an automated UX audit?',
            a: "After every meaningful release, and at least once a month on your most important pages. Re-audits show what was fixed, what regressed and what's new.",
          },
        ],
      },
    ],
    sources: [
      {
        title: 'Deque Study Shows Its Automated Testing Identifies 57 Percent of Digital Accessibility Issues',
        publisher: 'Deque Systems',
        note: 'March 10, 2021',
        url: 'https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/',
      },
      {
        title: 'The WebAIM Million: The 2026 report on the accessibility of the top 1,000,000 home pages',
        publisher: 'WebAIM',
        note: 'February 2026 data',
        url: 'https://webaim.org/projects/million/',
      },
      {
        title: 'Web Almanac 2025, Accessibility chapter',
        publisher: 'HTTP Archive',
        note: 'published January 15, 2026',
        url: 'https://almanac.httparchive.org/en/2025/accessibility',
      },
      {
        title: 'Web Almanac 2025, Performance chapter',
        publisher: 'HTTP Archive',
        note: 'published January 15, 2026',
        url: 'https://almanac.httparchive.org/en/2025/performance',
      },
      {
        title: "Testing ChatGPT-4 for 'UX Audits' Shows an 80% Error Rate & 14–26% Discoverability Rate",
        publisher: 'Baymard Institute',
        note: 'October 18, 2023',
        url: 'https://baymard.com/research-articles/gpt-ux-audit',
      },
      {
        title: 'AI Heuristic UX Evaluations with a 95% Accuracy Rate (Human-Level Accuracy)',
        publisher: 'Baymard Institute',
        note: "updated May 28, 2026 (includes Microsoft UX researchers' March 2025 tests)",
        url: 'https://baymard.com/research-articles/ai-heuristic-evaluations',
      },
      {
        title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
        publisher: 'W3C',
        note: 'criteria 1.4.3, 2.4.11 and 2.5.8',
        url: 'https://www.w3.org/TR/WCAG22/',
      },
    ],
    cta: {
      title: "See what your site's audit covers, and what it doesn't",
      text: "Paste your URL into ProCurveUX for a free audit. You'll get a ranked fix list in about a minute, with every finding marked as measured, interaction-tested or needing your review.",
    },
  },
];

export const postBySlug = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);

/** "Nov 6, 2026" (or "November 6, 2026" with 'long'), the same on the server and in every browser. */
export function formatDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = style === 'long' ? months[m - 1] : months[m - 1].slice(0, 3);
  return `${month} ${d}, ${y}`;
}

/** The anchor for a subheading: "What a primary button needs" gives what-a-primary-button-needs. */
export const headingId = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** An article's subheadings, in order: the "On this page" list. */
export const outline = (post: Post): { id: string; text: string }[] =>
  post.body.flatMap((b) => (b.type === 'h2' ? [{ id: headingId(b.text), text: b.text }] : []));

/** Words in a piece of text, counted the way a reader would. */
export const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/** The words a block asks a reader to read. */
function blockText(b: Block): string[] {
  switch (b.type) {
    case 'list':
      return b.items.map((i) => (typeof i === 'string' ? i : `${i.lead} ${i.text}`));
    case 'table':
      // Scanned, not read word by word: only the caption counts towards reading time.
      return [b.caption];
    case 'faq':
      return b.items.flatMap((i) => [i.q, i.a]);
    case 'p':
    case 'tip':
      return [('lead' in b ? b.lead : 'label' in b ? b.label : '') ?? '', b.text];
    default:
      return [b.text];
  }
}

/** The questions in an article's `faq` blocks: given to search engines as an FAQPage. */
export const faqsOf = (post: Post): { q: string; a: string }[] => post.body.flatMap((b) => (b.type === 'faq' ? b.items : []));

/** About 238 words a minute (the average adult silent reading rate for non-fiction), never less than one. */
export function readMinutes(post: Post): number {
  const words = wordCount(post.body.flatMap(blockText).join(' '));
  return Math.max(1, Math.round(words / 238));
}

/** The article shown large at the top of /blog. */
export const featuredPost = (): Post => POSTS.find((p) => p.featured) ?? POSTS[0];

/** Two letters for an author's badge: "ProCurveUX team" gives PX, "Jane Liu" gives JL. */
export function initials(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const caps = first.match(/[A-Z]/g) ?? [];
  if (caps.length >= 2) return caps[0] + caps[caps.length - 1];
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Runs whenever the blog is built: a card holds only so much.
for (const p of POSTS) {
  for (const field of ['title', 'description'] as const) {
    const n = wordCount(p[field]);
    if (n > WORD_LIMITS[field]) {
      throw new Error(
        `Blog article "${p.slug}": the ${field} is ${n} words and the limit is ${WORD_LIMITS[field]}. Shorten it by ${n - WORD_LIMITS[field]}.`,
      );
    }
  }
}
