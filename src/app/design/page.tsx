'use client';

import { useState } from 'react';
import {
  ArrowLink,
  Badge,
  Button,
  Card,
  Container,
  CountPill,
  Divider,
  Dot,
  Eyebrow,
  FieldLabel,
  GradientText,
  Grid,
  Heading,
  IconTile,
  Meter,
  Row,
  Section,
  SectionHeader,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import { SEVERITY_DOTS, SeverityTag } from '@/components/ui/SeverityTag';
import {
  SPACE,
  color,
  hairline,
  radius,
  shadow,
  staticColor,
  t,
  text,
  tracking,
  type TextStyle,
} from '@/design/tokens';

const THEMABLE = [
  'bg', 'card', 'popover', 'muted', 'fg', 'mutedFg', 'border', 'input',
  'primary', 'primaryFg', 'accent', 'accentFg', 'secondary', 'secondaryFg',
  'destructive', 'destructiveFg', 'ring',
] as const;

const RAMP_GROUPS: { title: string; note: string; keys: TextStyle[] }[] = [
  {
    title: 'Serif — headlines',
    note: 'Instrument Serif. The clamped steps scale with the viewport.',
    keys: [
      'display', 'displayCta', 'displayNumeral', 'sectionTitle', 'sectionTitleLoose',
      'sectionTitleFaq', 'resultTitle', 'cardTitleLg', 'cardTitle', 'price', 'quote',
      'quoteBrand', 'quoteName', 'audienceTitle',
    ],
  },
  {
    title: 'Sans — body',
    note: 'Figtree. `lead` opens a section; `body` and below carry the detail.',
    keys: ['leadHero', 'leadCta', 'lead', 'body', 'bodySm', 'bodyXs', 'caption', 'fine', 'micro'],
  },
  {
    title: 'Sans — labels',
    note: 'Weights 500 and 600. These name things rather than say them.',
    keys: ['label', 'labelStrong', 'labelXl', 'labelLg', 'labelMd', 'labelSm', 'chip', 'eyebrow', 'eyebrowPlain'],
  },
  {
    title: 'Mono — measurements',
    note: 'DM Mono. Reserved for anything the audit engine measured.',
    keys: ['mono', 'monoXs', 'monoLabel', 'metricLg', 'metric'],
  },
];

/** A labelled block on the reference page. */
function Spec({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Stack gap={20} style={{ scrollMarginTop: 80 }}>
      <Stack gap={6}>
        <Heading level={2} variant="cardTitle">
          {title}
        </Heading>
        {note && (
          <Text as="p" variant="bodySm" tone="muted" width="section" wrap="pretty">
            {note}
          </Text>
        )}
      </Stack>
      {children}
    </Stack>
  );
}

/** The name a value is imported under, set in mono. */
function Token({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="monoXs" tone="muted" wrap="nowrap">
      {children}
    </Text>
  );
}

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);

  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{ minHeight: '100vh', background: color.bg, color: color.fg }}
    >
      <Section tone="muted">
        <Container padY={64}>
          <Row justify="between" align="start" gap={24} wrap>
            <Stack gap={12} align="start">
              <Eyebrow>Design system</Eyebrow>
              <Heading level={1} variant="sectionTitle">
                Zaudit components and tokens
              </Heading>
              <Text as="p" variant="lead" tone="muted" width="section" wrap="pretty">
                Every value below already existed in the homepage before it had names. Import
                components from <code>@/components/ui</code> and raw values from{' '}
                <code>@/design/tokens</code>.
              </Text>
            </Stack>
            <Button variant="outline" onClick={() => setDark((d) => !d)}>
              {dark ? 'Light' : 'Dark'} theme
            </Button>
          </Row>
        </Container>
      </Section>

      <Container padY={64}>
        <Stack gap={80}>
          {/* ------------------------------------------------------------ colour */}
          <Spec
            title="Colour"
            note="Roles, not hues. Each resolves through a CSS custom property, so the theme toggle above swaps all of them without a single component knowing."
          >
            <Grid columns={4} gap={16}>
              {THEMABLE.map((name) => (
                <Card key={name} radius={radius.md} pad={0} clip>
                  <div style={{ height: 64, background: `var(--${camelToVar(name)})` }} />
                  <Stack gap={2} style={{ padding: '12px 14px', borderTop: hairline() }}>
                    <Text variant="labelSm">{name}</Text>
                    <Token>--{camelToVar(name)}</Token>
                  </Stack>
                </Card>
              ))}
            </Grid>

            <Grid columns={2} gap={16}>
              <Card radius={radius.md} pad={0} clip>
                <div style={{ height: 64, background: color.gradient }} />
                <Stack gap={2} style={{ padding: '12px 14px', borderTop: hairline() }}>
                  <Text variant="labelSm">gradient</Text>
                  <Token>color.gradient · 100deg blue → violet</Token>
                </Stack>
              </Card>
              <Card radius={radius.md} pad={0} clip>
                <Row gap={0} style={{ height: 64 }}>
                  <div style={{ flex: 1, background: staticColor.ink, height: '100%' }} />
                  <div style={{ flex: 1, background: staticColor.white, height: '100%' }} />
                </Row>
                <Stack gap={2} style={{ padding: '12px 14px', borderTop: hairline() }}>
                  <Text variant="labelSm">staticColor</Text>
                  <Token>ink · white — fixed, do not flip with the theme</Token>
                </Stack>
              </Card>
            </Grid>
          </Spec>

          {/* -------------------------------------------------------- typography */}
          <Spec
            title="Type ramp"
            note="Named by the job each step does. The design carries near-duplicate steps (13/18, 13/19, 13/20, 13/21 all appear), so one-offs compose through t(weight, size, lineHeight, family) rather than being snapped onto a scale that would change the design."
          >
            {RAMP_GROUPS.map((group) => (
              <Stack key={group.title} gap={12}>
                <Stack gap={4}>
                  <FieldLabel>{group.title}</FieldLabel>
                  <Text variant="caption" tone="muted">
                    {group.note}
                  </Text>
                </Stack>
                <Card radius={radius.md} pad={0} clip>
                  {group.keys.map((key, i) => (
                    <Row
                      key={key}
                      gap={24}
                      align="baseline"
                      style={{
                        padding: '16px 20px',
                        ...(i ? { borderTop: hairline() } : null),
                      }}
                    >
                      <Token>{key}</Token>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ font: text[key], whiteSpace: 'nowrap' }}>
                          {key.startsWith('mono') || key.startsWith('metric')
                            ? '0123456789'
                            : 'Find what’s hurting your UX'}
                        </span>
                      </div>
                    </Row>
                  ))}
                </Card>
              </Stack>
            ))}

            <Stack gap={12}>
              <FieldLabel>Tracking</FieldLabel>
              <Row gap={8} wrap>
                {Object.entries(tracking).map(([name, value]) => (
                  <CountPill key={name}>
                    {name} · {value}
                  </CountPill>
                ))}
              </Row>
            </Stack>
          </Spec>

          {/* ----------------------------------------------------------- spacing */}
          <Spec
            title="Spacing"
            note="Pixels, not step indices — gap={20} means twenty pixels. On-scale values autocomplete; an off-scale number still compiles, because the design has a few."
          >
            <Card radius={radius.md} pad={24}>
              <Stack gap={10}>
                {SPACE.filter((v) => v > 0).map((v) => (
                  <Row key={v} gap={16}>
                    <Token>{String(v).padStart(3, ' ')}</Token>
                    <div style={{ height: 12, width: v, background: color.primary, borderRadius: 2 }} />
                  </Row>
                ))}
              </Stack>
            </Card>
          </Spec>

          {/* -------------------------------------------------- radius / shadow */}
          <Grid columns={2} gap={48}>
            <Spec title="Radius">
              <Row gap={16} wrap>
                {Object.entries(radius).map(([name, value]) => (
                  <Stack key={name} gap={8} align="center">
                    <div
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: value,
                        background: color.muted,
                        border: hairline(),
                      }}
                    />
                    <Token>{name}</Token>
                  </Stack>
                ))}
              </Row>
            </Spec>

            <Spec title="Elevation">
              <Row gap={16} wrap>
                {(['xs', 'sm', 'md', 'lg'] as const).map((name) => (
                  <Stack key={name} gap={8} align="center">
                    <div
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: radius.md,
                        background: color.card,
                        boxShadow: shadow[name],
                      }}
                    />
                    <Token>{name}</Token>
                  </Stack>
                ))}
              </Row>
            </Spec>
          </Grid>

          <Divider />

          {/* --------------------------------------------------------- controls */}
          <Spec
            title="Button"
            note="Five sizes and seven variants. The design pins buttons to pills; radius opens that up for the one CTA it shapes at 12px."
          >
            <Card radius={radius.md} pad={24} gap={20}>
              <Row gap={12} wrap>
                {(['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
                  <Button key={v} variant={v} iconEnd="IconArrowUpRight">
                    {v}
                  </Button>
                ))}
              </Row>
              <Divider />
              <Row gap={12} wrap align="center">
                {(['sm', 'default', 'lg'] as const).map((s) => (
                  <Button key={s} size={s} iconEnd="IconArrowUpRight">
                    size {s}
                  </Button>
                ))}
                <Button size="pill" variant="secondary" iconEnd="IconArrowUpRight">
                  size pill
                </Button>
                <Button size="xl" variant="ink" radius={12} iconEnd="IconArrowUpRight">
                  size xl
                </Button>
              </Row>
              <Divider />
              <Row gap={12} wrap>
                <Button disabled>disabled</Button>
                <div style={{ background: color.primary, padding: 12, borderRadius: radius.md }}>
                  <Button variant="onPrimary" size="pill" iconEnd="IconArrowUpRight">
                    onPrimary
                  </Button>
                </div>
              </Row>
            </Card>
          </Spec>

          <Spec title="Links, badges and tags">
            <Card radius={radius.md} pad={24} gap={20}>
              <Row gap={24} wrap align="center">
                <ArrowLink href="#">md link</ArrowLink>
                <ArrowLink href="#" size="sm">
                  sm link
                </ArrowLink>
                <ArrowLink href="#" size="lg" underline>
                  lg underlined
                </ArrowLink>
                <ArrowLink href="#" tone="primary">
                  primary tone
                </ArrowLink>
              </Row>
              <Divider />
              <Row gap={12} wrap>
                {(['default', 'secondary', 'outline', 'destructive'] as const).map((v) => (
                  <Badge key={v} variant={v}>
                    {v}
                  </Badge>
                ))}
              </Row>
              <Divider />
              <Row gap={8} wrap>
                {(['Critical', 'High', 'Medium', 'Low'] as const satisfies readonly import('@/lib/audit/types').SeverityLabel[]).map((s) => (
                  <SeverityTag key={s} severity={s} />
                ))}
                {(['Critical', 'High', 'Medium', 'Low'] as const satisfies readonly import('@/lib/audit/types').SeverityLabel[]).map((s) => (
                  <CountPill key={s} dot={SEVERITY_DOTS[s]}>
                    12 {s}
                  </CountPill>
                ))}
              </Row>
            </Card>
          </Spec>

          {/* --------------------------------------------------------- surfaces */}
          <Spec
            title="Card"
            note="The bordered surface the page is mostly built from — fifteen hand-written copies before it had a name."
          >
            <Grid columns={4} gap={16}>
              <Card pad={20} gap={8}>
                <Text variant="labelSm">tone card</Text>
                <Text variant="caption" tone="muted">
                  The default surface.
                </Text>
              </Card>
              <Card tone="muted" pad={20} gap={8}>
                <Text variant="labelSm">tone muted</Text>
                <Text variant="caption" tone="muted">
                  Recessed, for nested panels.
                </Text>
              </Card>
              <Card tone="primary" border={staticColor.onPrimaryLine} pad={20} gap={8}>
                <Text variant="labelSm" tone="inverse">
                  tone primary
                </Text>
                <Text variant="caption" tone="inverseDim">
                  Inverts its own ink.
                </Text>
              </Card>
              <Card elevation="md" pad={20} gap={8}>
                <Text variant="labelSm">elevation md</Text>
                <Text variant="caption" tone="muted">
                  Lifted off the page.
                </Text>
              </Card>
            </Grid>
          </Spec>

          <Spec title="Icon tiles, dots, meters">
            <Card radius={radius.md} pad={24} gap={24}>
              <Row gap={20} align="center" wrap>
                <IconTile icon="target" />
                <IconTile icon="bolt" variant="gradient" size={56} />
                <Divider orientation="vertical" length={32} />
                <Row gap={12} align="center">
                  <Dot variant="bullet" />
                  <Dot />
                  <Dot variant="ring" tone={color.primary} />
                </Row>
                <Divider orientation="vertical" length={32} />
                <GradientText style={{ font: text.cardTitle }}>Gradient text</GradientText>
              </Row>
              <Stack gap={12} style={{ maxWidth: 380 }}>
                <Meter value={78} label="Example score" />
                <Meter value={42} size={4} fill={color.fg} label="Example category" />
              </Stack>
            </Card>
          </Spec>

          {/* ----------------------------------------------------------- layout */}
          <Spec
            title="Layout"
            note="Section is the band and its hairline; Container is the 1152px measure. Stack, Row and Grid replace the flex declarations that were restated on almost every element."
          >
            <Card radius={radius.md} pad={24} gap={16}>
              <Text variant="labelSm">Grid columns={4} gap={16}</Text>
              <Grid columns={4} gap={16}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{ height: 56, background: color.muted, borderRadius: radius.sm }}
                  />
                ))}
              </Grid>
              <Text variant="labelSm">Row + Spacer</Text>
              <Row gap={12} style={{ background: color.muted, padding: 12, borderRadius: radius.sm }}>
                <Badge>start</Badge>
                <Spacer />
                <Badge variant="secondary">pushed to the end</Badge>
              </Row>
            </Card>
          </Spec>

          <Spec
            title="SectionHeader"
            note="The kicker / headline / lead opening, on nine of the twelve homepage sections."
          >
            <Card radius={radius.md} pad={32} gap={40}>
              <SectionHeader
                eyebrow="Eyebrow pill"
                title="Left aligned, the default"
                lead="The lead paragraph sits at the section measure so the line length stays readable."
              />
              <Divider />
              <SectionHeader
                eyebrow="Plain eyebrow"
                eyebrowVariant="plain"
                title="Centred, with the plain kicker"
                lead="Used where the section is a full-width statement rather than a column of content."
                align="center"
                width={620}
              />
            </Card>
          </Spec>
        </Stack>
      </Container>

      <Section tone="muted" divided={false}>
        <Container padY={48}>
          <Text variant="caption" tone="muted">
            Rendered from the same components as the homepage — if something drifts here, it has
            drifted there too.
          </Text>
        </Container>
      </Section>
    </div>
  );
}

/** `mutedFg` → `muted-fg`, so a token name can address its CSS custom property. */
function camelToVar(name: string): string {
  return name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}
