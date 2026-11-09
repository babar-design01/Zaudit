/**
 * The laws on /ux-laws. Each one keeps a stable `slug`, which is its card's
 * anchor today (/ux-laws#fitts-law) and its own page later (/ux-laws/fitts-law).
 *
 * `check` names only rules that exist in src/lib/audit/catalog, quoted by their
 * `name` as the report prints them. Where nothing in the engine measures a law,
 * the card says so; do not add a check here without adding it to the catalog.
 */

export type UxLaw = {
  slug: string;
  name: string;
  /** Who described it, and when. */
  origin: string;
  definition: string;
  example: string;
  check: {
    /** automatic: a rule measures it. partial: a rule covers part of it. manual: a person has to judge it. */
    kind: 'automatic' | 'partial' | 'manual';
    /** Rule names from the catalog, as the report shows them. */
    rules: string[];
    note: string;
  };
};

export const UX_LAWS: UxLaw[] = [
  {
    slug: 'fitts-law',
    name: "Fitts's law",
    origin: 'Paul Fitts, 1954',
    definition: 'The time it takes to hit a target depends on how far away it is and how big it is. Small, distant targets are slow and easy to miss.',
    example: 'A 16px "×" in the corner of a mobile pop-up. People tap the page behind it, or give up and leave.',
    check: {
      kind: 'automatic',
      rules: ['Target size below minimum', 'Tap targets too small for a thumb'],
      note: 'Every control is measured. Under 24×24 CSS pixels fails WCAG 2.2; under 44×44 is flagged as below the recommended size for touch.',
    },
  },
  {
    slug: 'hicks-law',
    name: "Hick's law",
    origin: 'William Hick, 1952, and Ray Hyman, 1953',
    definition: 'The more options people are shown at once, the longer they take to choose one.',
    example: 'A hero with "Start free trial", "Book a demo", "Watch video" and "See pricing", all styled the same. Visitors stall instead of picking.',
    check: {
      kind: 'partial',
      rules: ['Competing primary calls to action', 'Navigation does not collapse on a phone'],
      note: 'Flags buttons of equal weight competing in one area, and phone navigation that shows six or more links at once. Whether a menu has too many items overall is a judgement call.',
    },
  },
  {
    slug: 'jakobs-law',
    name: "Jakob's law",
    origin: 'Jakob Nielsen, 2000',
    definition: 'People spend most of their time on other websites, so they expect yours to work the way those do.',
    example: 'A logo that does not link home, or a basket icon on the left. Visitors look where every other shop puts it and find nothing.',
    check: {
      kind: 'partial',
      rules: ['Inconsistent interaction pattern for the same task', 'Current location not indicated in navigation'],
      note: 'Checks that your site is consistent with itself and shows people where they are. Whether it matches conventions on other sites is left for a person to review.',
    },
  },
  {
    slug: 'millers-law',
    name: "Miller's law",
    origin: 'George Miller, 1956',
    definition: 'People can hold only a few items in working memory at once. Miller suggested about seven; later research puts it closer to four chunks.',
    example: 'A sign-up form with 14 fields in one long column, or a phone number shown as 03001234567 instead of 0300 123 4567.',
    check: {
      kind: 'partial',
      rules: ['Content wall without structure', 'Form asks for information not required by the task'],
      note: 'Flags long runs of text with no headings or breaks, and forms asking for more than the task needs. How well content is chunked beyond that needs a person.',
    },
  },
  {
    slug: 'gestalt-proximity',
    name: 'Gestalt law of proximity',
    origin: 'Gestalt psychologists, 1920s',
    definition: 'Things that sit close together are seen as belonging together.',
    example: 'A field label spaced evenly between two inputs. Readers cannot tell which field it names.',
    check: {
      kind: 'automatic',
      rules: ['Insufficient whitespace around dense content', 'Alignment drift'],
      note: 'Measures the gaps between groups against the gaps inside them, and flags edges that almost line up but do not.',
    },
  },
  {
    slug: 'von-restorff-effect',
    name: 'Von Restorff effect',
    origin: 'Hedwig von Restorff, 1933',
    definition: 'When several similar things are shown, the one that differs is the one people notice and remember.',
    example: 'A primary "Buy now" button drawn with the same outline as "Add to wishlist". Nothing stands out, so nothing gets clicked first.',
    check: {
      kind: 'automatic',
      rules: ['Button hierarchy not visually separable', 'Visual hierarchy inverted'],
      note: 'Compares the visual weight of primary and secondary actions, and flags a page where secondary content outweighs the primary.',
    },
  },
  {
    slug: 'teslers-law',
    name: "Tesler's law",
    origin: 'Larry Tesler, 1980s',
    definition: 'Every task has some complexity that cannot be removed. The only question is whether the product or the person deals with it.',
    example: 'A checkout that asks for card type when it could tell from the first digits of the number.',
    check: {
      kind: 'manual',
      rules: ['Form asks for information not required by the task'],
      note: 'Mostly a judgement call, flagged for manual review. The nearest automatic check catches forms that ask for fields the task does not need.',
    },
  },
  {
    slug: 'doherty-threshold',
    name: 'Doherty threshold',
    origin: 'Walter Doherty and Ahrvind Thadani, IBM, 1982',
    definition: 'People stay engaged when a system responds in under about 400 milliseconds. Slower than that, attention drifts.',
    example: 'A "Submit" button that shows nothing for two seconds. People click again and send the form twice.',
    check: {
      kind: 'automatic',
      rules: ['Action without feedback', 'Server is slow to answer', 'First screen takes too long to paint'],
      note: 'Clicks are watched for a visible response, and the server and first-paint times are measured in a real browser.',
    },
  },
  {
    slug: 'peak-end-rule',
    name: 'Peak-end rule',
    origin: 'Daniel Kahneman and colleagues, 1993',
    definition: 'People judge an experience mostly by its most intense moment and by how it ended, not by the average.',
    example: 'A smooth checkout that ends with shipping costs appearing on the last step. That surprise is what people remember.',
    check: {
      kind: 'manual',
      rules: ['Cost revealed only at the final step'],
      note: 'How a whole journey feels is a judgement call, flagged for manual review. One bad ending is caught automatically: costs that first appear on the last step.',
    },
  },
  {
    slug: 'serial-position-effect',
    name: 'Serial position effect',
    origin: 'Hermann Ebbinghaus, 1885',
    definition: 'People remember the first and last items in a list best, and the middle ones least.',
    example: 'A nav that buries "Pricing" fifth of nine links, between items people skim past.',
    check: {
      kind: 'manual',
      rules: [],
      note: 'Not checked automatically. Whether the most important items sit at the start and end of a list depends on your goals, so it is left for a person to review.',
    },
  },
];
