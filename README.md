# Zaudit — homepage

The Zaudit marketing homepage, built from the Claude Design handoff in `../project`
(`Homepage Veltrex.dc.html`). Next.js App Router + React + TypeScript.

```bash
npm install
cp .env.example .env.local   # see "Keys" below — the audit degrades without them
npm run dev                  # http://localhost:3000
```

## Layout

```
src/
  design/tokens.ts        colour, type ramp, spacing, radius, shadow, motion — typed
  app/
    layout.tsx            fonts + metadata
    globals.css           the design's token set (light + dark), keyframes, hover rules
    page.tsx              renders <Homepage />
    design/page.tsx       /design — every token and component on one page
    api/audit/route.ts    POST /api/audit — NDJSON stream of stage/result/error events
  components/
    Homepage.tsx          section composition + shared audit state
    sections/             one file per section, in page order
    site/                 announcement bar, nav, footer
    ui/                   the design system — see below
  content/homepage.ts     every string on the page
  hooks/useAudit.ts       drives the hero's idle/goal/running/error/done states
  lib/audit/              the engine: framework + criteria catalog, browser
                          probes, checks → criteria → pillars → score
```

## The design system

`src/design/tokens.ts` holds the values; `src/components/ui` holds the components
built from them. Both are extracted from what the page already did — before this
existed, the twelve sections between them declared 57 distinct `font` shorthands,
16 hand-written section borders and 15 hand-written card surfaces.

```ts
import { Section, Container, Stack, Card, Heading, Text } from '@/components/ui';
import { color, radius, t } from '@/design/tokens';
```

| file | what's in it |
| --- | --- |
| `ui/layout.tsx` | `Section`, `Container`, `Stack`, `Row`, `Grid`, `Spacer`, `Divider`, `Card` |
| `ui/typography.tsx` | `Text`, `Heading`, `Eyebrow`, `GradientText`, `SectionHeader` |
| `ui/elements.tsx` | `ArrowLink`, `IconTile`, `Dot`, `CountPill`, `Meter`, `MetaRow`, `FieldLabel` |
| `ui/SeverityTag.tsx` | the Critical/High/Medium/Low scale, shared by the hero and the results |
| `ui/Button` `Badge` `Input` `Icon` `ImageSlot` | ported straight from the design system |

Three things worth knowing before you add to it:

**Spacing is pixels, not step indices.** `gap={20}` means twenty pixels. Values on
the design's scale autocomplete; an off-scale number still compiles, because the
design has a few.

**The type ramp is named by job, not size** — `lead`, `sectionTitle`, `metric`.
The design carries near-duplicate steps (13/18, 13/19, 13/20 and 13/21 all appear),
so those are transcribed as they are rather than snapped onto a tidier scale that
would change the rendering. A step the ramp doesn't name composes through
`t(weight, size, lineHeight, family)` instead of a raw string.

**Colour is a role, resolved through a CSS custom property.** Nothing hard-codes a
hex except `staticColor`, which is the ink the design fixes regardless of theme.
This is why the footer can redefine `--fg`/`--border` on itself and every component
inside it inverts without knowing it is on a dark field — and why `/design`'s theme
toggle works at all.

`/design` renders the whole thing from the same components as the homepage, so if
something drifts there it has drifted here too.

## Design fidelity

Tokens, type ramps, spacing, radii, shadows and the 1152px container are transcribed
verbatim from the design file — `globals.css` and `src/design/tokens.ts` are the
design, not an approximation of it. `src/components/ui/icon-data.ts` is generated
from the design system's own icon data, so the glyphs are byte-identical.

Moving the sections onto the components above was checked rather than assumed: the
computed styles of all 784 elements were captured before the change and diffed
against the rendering after it. What survived was 43 differences across 763 matched
elements, every one deliberate — `whiteSpace: nowrap` and a centred label on the two
buttons that had been hand-written instead of using `Button`, a 1px rule that is now
a `Divider` rather than a bare `borderTop`, the browser's default 6px padding on a
full-width centred button, and `start` → `flex-start`, which is the same value. No
rendered pixel moved.

Both themes are defined. The design has no theme toggle (it was a design-tool prop),
so the page renders light; add `data-theme="dark"` to `<html>` to switch, or wire a
toggle to that attribute. `/design` has one, which is the quickest way to see the
dark palette.

## The audit engine

The engine implements the **Audit Benchmark Framework v1.0**: pillars → criteria
→ evidence → score. The framework's types are in `src/lib/audit/framework.ts`,
the criteria library is `src/lib/audit/catalog/pillars.ts`, and the measurements
behind the criteria are the checks in `src/lib/audit/catalog/*.ts` with their
code in `src/lib/audit/rules/`.

**Two layers, deliberately separate.** A **criterion** is what the report
quotes: a checkable statement carrying the standard it comes from, the platforms
it applies to, whether it can be measured, and what counts as a pass. A **check**
is the engine's unit of measurement, with the evidence it must produce and the
fix to print. A criterion names the checks that decide it; a check can serve more
than one criterion. Nothing in the report says `ACC-012` — it says `AC-11`, WCAG
2.2 AA 2.5.8, measured 20×22px, required 24×24px.

**Eight pillars, plus two toggles.** Usability & task flow (Nielsen, ISO
9241-11), Information architecture & navigation, Visual hierarchy & layout
(Gestalt), Consistency & design system, System states & feedback, Accessibility
(WCAG 2.2 AA), Content & microcopy, Performance & technical quality (Core Web
Vitals). Trust & privacy and Conversion are switches, off unless the goal turns
them on.

**The goal is declared before the audit starts**, because it sets the weights —
never the criteria. Six presets ship; a heavier pillar counts double.

| stage | what happens | where |
| --- | --- | --- |
| 0 · measure | The page opens in real Chromium at 1440×900 and is measured: screenshot, geometry and computed styles, axe-core, a real Tab walk that diffs pixels to see focus, flash detection, a reduced-motion re-read, Core Web Vitals from the browser's own observers, a sample of its links followed, and a second render at 320px | `browser.ts`, `probe*.ts` |
| 1 · classify | Page type and platforms are decided **before any criterion is judged**. The model decides when a key is set, measured signals otherwise | `classify.ts`, `review.ts` |
| 2 · evaluate | Every check runs, then rolls up: a criterion is `pass`, `partial`, `fail`, `not applicable` or `not assessed` | `evaluate.ts`, `rules/*.ts` |
| 3 · review | The model may flag false positives, lower confidence, move severity by one step and rewrite the prose. It cannot add a finding. Criteria marked `assisted` are only confirmed by this review | `review.ts` |
| 4 · score | Each pillar is the weighted pass rate of its criteria (a partial counts half); the overall score applies the goal's weights; the top five fixes are ranked by severity × frequency × goal weight | `score.ts` |

**Enforced in code, not left to convention:**

- **Evidence or it did not happen.** Every instance needs a selector, a box on the capture it refers to, an observed value, an expected value, and every evidence field its check lists. Anything missing is **discarded**, never downgraded.
- **Never a false pass.** A criterion whose measurements did not run reports `not assessed` with the reason — never a pass. Criteria needing a person carry the task instead, and are left out of both sides of the score rather than counted as passes or failures.
- **A thin audit is not scored.** Below a quarter of the criteria in scope, the report says too little could be measured rather than printing a number over whatever happened to work.
- **First screen for layout.** Nothing whose box falls outside the 1440×900 capture is flagged. Page-level failures (a missing `lang`, a broken link, a 320px overflow) are document-level, and the reflow and dark-mode probes keep their own captures.
- **Confidence floors.** An instance below its check's floor goes to review with its evidence, and changes no verdict. A subjective check needs its independent signals before it can fire at all.
- **One root cause, one finding.** Instances are clustered by root cause. Where two checks describe the same defect on one element, only the more severe survives.
- **Criteria judged by reading need the model.** Error copy, button verbs, which fields a task needs, which element dominates a region: the candidate and its evidence are found in code, but without a completed model review the criterion reports `not assessed` and the finding is held for a person.
- **Nothing is submitted, pressed or purchased.** The probes type into fields and blur them, ask forms to validate themselves (`reportValidity`, which sends nothing), press Escape, click a modal's backdrop, hover with the real pointer and read the pressed state by forcing `:active` through the DevTools protocol. They never submit a form, press a destructive control, or advance a flow. Criteria that would need that are reviewer tasks.
- **Probes put the page back.** The dark theme is switched on and off, text is stress-tested at 2× and 0.3× its length and restored, and the window returns to 1440×900 after the 320px pass.
- **Discipline, not taste.** The design-system criteria never judge whether a design is attractive. They build the first screen's token inventory and hold the page to its own type scale or spacing unit when 70% of uses sit on one. Vendor widgets, ads, iframes, SVG internals and anything marked `data-audit-ignore` are left out.
- **A refused visit is not audited.** If the site answers 401, 403, 429 or 503, which is usually bot protection, the audit stops with that message rather than scoring the block page.
- **The model is checked, not trusted.** Its edits are refused if they raise confidence, move severity more than one step, use a banned phrase or heuristic jargon, state a number the evidence doesn't contain, or give a fix that doesn't name the element and the exact change. A false positive it flags goes to review; it is not deleted.

**Severity** is Nielsen's 0–4 scale on every failure: 4 blocks a task or shuts people out, 3 is significant friction, 2 is minor, 1 is cosmetic.

**Adding criteria** is data: a criterion in `catalog/pillars.ts` naming the checks that decide it. A criterion naming no check is not a gap — it is a reviewer task, and the report lists it as one. The tests fail if a criterion names a check that does not exist, or if a check feeds no criterion.

**Tests.** `npm run test:audit` runs the real engine in Chromium against fixture pages: a deliberately broken page, a compliant one, broken and correct onboarding forms, a listing, three modals, a page with no design system and one built from tokens. Each measurable check must fail on the broken fixture and pass on the good one; every layout check must report `not_evaluated` with no browser; the model validators are fed replies that try to cheat. The suite also pins regressions found on live sites: Chrome's default two-tone focus ring, Tab moving through an iframe, a button animating its own label on hover, a login page with extra inputs, a card-form demo on a site root, a link that navigates on mousedown, and a site whose own `.drift` class was once mistaken for a chat vendor's. `npx tsx scripts/ui-dump.ts <url>` prints the design-system checks for one page.

### Keys

| variable | without it | where |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | page type comes from measured signals only; findings keep the catalog's own wording; no false-positive review | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `JINA_API_KEY` | only matters when no browser is available: single-page apps then read as an empty shell | [jina.ai/reader](https://jina.ai/reader) — free tier |

A browser is found in this order: `PLAYWRIGHT_CHROMIUM_PATH`, then an installed
Chrome, then Edge, then Playwright's own download. A developer machine usually
needs none of them set. A server wants either `npx playwright install chromium`
or the official Playwright image. `ZAUDIT_CAPTURE=off` skips the browser, and every
rule that needs layout, colour or focus then reports `not_evaluated`.

The audit completes without any of them. It just has less to say, and says so.

### Deploying it

Every audit drives a real browser for 30–60 seconds and streams its progress, so
this does not fit a free serverless tier — their function timeouts are shorter
than a single run, and the browser does not fit in the bundle. It needs a
container, or a machine that stays up.

```bash
docker build -t zaudit .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=… zaudit
```

The image is Debian slim plus Chromium (only Chromium: Firefox and WebKit would
triple it for browsers nothing here uses). `render.yaml` is a blueprint for
[Render](https://render.com) — point it at this repo and it builds the
Dockerfile. Any host that runs a container works the same way; the only
requirements are that the process can start a browser and that a request may run
for a minute.

**Sizing.** A run holds one Chromium with the page open, plus the captures it
has taken. 512MB is the floor and a heavy page can pass it; 1GB is comfortable.
The browser is kept warm for 60 seconds between audits, so a second run on an
idle instance starts a second faster.

**Exposure.** The endpoint fetches whatever address it is given, which is the
point of it, so `net.ts` refuses private, loopback, link-local and CGNAT ranges
before every request and again on every redirect. The route meters 10 audits per
IP per minute. Both guards live in process memory: several instances want Redis,
and a public deployment wants something in front of it deciding who may run an
audit at all.

### Fetching someone else's page

`net.ts` resolves the host and checks the address before anything is requested. A
public endpoint that fetches whatever a stranger types is otherwise a confused
deputy: `169.254.169.254` is the cloud metadata endpoint and `127.0.0.1` is
whatever else the box is running, and both resolve perfectly well from a server.
Loopback, link-local, private, CGNAT and multicast ranges are refused, as are
non-web schemes and ports — and a hostname is checked against what it resolves to
rather than how it is spelled.

The route meters what it costs: 10 audits per IP per minute, and a 10-minute result
cache so re-running the same address is free. Validation happens before metering, so
a mistyped address does not spend the reader's budget. Both live in process memory,
which is the right size for one server; several instances want Redis instead.

### The dialog

Running an audit opens a dialog over the page (`sections/AuditDialog.tsx`). It
shows the stage the engine is actually on, a rotating line describing that stage's
work, and a bar whose boundaries only move when a stage event arrives — inside a
stage it eases toward the next boundary without reaching it, so the motion says
"still working" without claiming progress the engine has not reported. It never
reads 100 until a result lands.

The rotating copy lives in `AUDIT_STAGE_LINES` in `content/homepage.ts`. Every
line describes work that always happens; the review stage describes the
checks that run whether or not a model is configured.

Closing the dialog mid-run aborts the request rather than leaving it to finish
unwatched — the engine is handed the request's abort signal and checks it between
stages. Escape and Cancel both close; a backdrop click does not, so a stray click
cannot throw away a run in progress. Once a run finishes the hero keeps the score,
so closing the dialog does not lose the result.

Nothing is pre-written or sampled. If a measurement fails, the rules that depend on it say so.

## Not yet built

The other seven pages (Product, Sample Audit, Pricing, Solutions, Resources, About,
Privacy, Terms) exist as designs in `../project` but are out of scope for this pass.
Nav and footer links point at the matching homepage sections rather than dead routes.
