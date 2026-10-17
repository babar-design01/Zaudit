import {
  Badge,
  Button,
  Card,
  Container,
  CountPill,
  Divider,
  ImageSlot,
  Row,
  Section,
  SectionHeader,
  Stack,
  Text,
} from '@/components/ui';
import { color, hairline, radius, staticColor, t, tracking } from '@/design/tokens';
import { PROOF_FIELDS } from '@/content/homepage';

/** A worked example of a single finding, shown as the real product would render it. */
export function ProductProof() {
  return (
    <Section id="proof">
      <Container padY={80}>
        <SectionHeader
          eyebrow="FROM URL TO UX INSIGHTS"
          title="See exactly what’s getting in the way."
          lead="Zaudit turns your website into structured, evidence-backed UX findings—showing where an issue occurs, why it matters, and what you can do about it."
          width={640}
        />

        <Card elevation="sm" clip style={{ marginTop: 48 }}>
          {/* finding header */}
          <Row
            align="start"
            justify="between"
            gap={20}
            wrap
            style={{ padding: '20px 24px', borderBottom: hairline() }}
          >
            <Stack gap={8}>
              <Text variant="mono" tone="muted">
                Finding #014
              </Text>
              <Text font={t(600, 20, 26)} style={{ letterSpacing: '-0.4px' }} wrap="pretty">
                Primary CTA lacks clear visual prominence
              </Text>
              {/* The design rules off the location, but not the severity badge. */}
              <Row gap={8} wrap>
                <Badge variant="destructive">High Severity</Badge>
                <Text variant="mono" tone="muted">
                  92% Confidence*
                </Text>
                <Divider orientation="vertical" />
                <Text variant="mono" tone="muted">
                  Homepage → Hero Section
                </Text>
              </Row>
            </Stack>
            <CountPill
              style={{
                padding: '4px 10px',
                borderRadius: radius.full,
                color: color.mutedFg,
                whiteSpace: 'nowrap',
              }}
            >
              Impact: High · Effort: Low
            </CountPill>
          </Row>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
            {/* annotated capture */}
            <div
              style={{
                position: 'relative',
                background: color.card,
                borderRight: hairline(),
                padding: 24,
              }}
            >
              <div style={{ position: 'relative', height: 520 }}>
                <ImageSlot placeholder="Drop the annotated page capture" radius={16} />
                {/* the pin tying the finding to the spot on the page */}
                <span
                  style={{
                    position: 'absolute',
                    left: 20,
                    bottom: 20,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: color.destructive,
                    color: staticColor.white,
                    font: t(500, 13, 26, 'mono'),
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  1
                </span>
              </div>
            </div>

            {/* reasoning */}
            <Stack>
              {PROOF_FIELDS.map((f) => (
                <Stack
                  key={f.label}
                  gap={6}
                  style={{ padding: '20px 24px', borderBottom: hairline() }}
                >
                  <Text
                    variant="chip"
                    tone="muted"
                    uppercase
                    style={{ letterSpacing: tracking.eyebrow }}
                  >
                    {f.label}
                  </Text>
                  <Text variant="bodySm" tone="fg" wrap="pretty">
                    {f.body}
                  </Text>
                </Stack>
              ))}
              <Row gap={12} style={{ padding: '20px 24px', background: color.muted, flex: 1 }}>
                <Button variant="primary" iconEnd="IconArrowUpRight">
                  Explore Sample Audit
                </Button>
              </Row>
            </Stack>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
