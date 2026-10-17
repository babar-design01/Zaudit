'use client';

import {
  ArrowLink,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  IconBox,
  Row,
  Section,
  SectionHeader,
  Spacer,
  Text,
} from '@/components/ui';
import { color, radius, t } from '@/design/tokens';
import { TIERS } from '@/content/homepage';

export function Pricing({ onRunAudit }: { onRunAudit: () => void }) {
  return (
    <Section id="plans" tone="muted">
      <Container padY={80}>
        <SectionHeader
          eyebrow="SIMPLE PRICING"
          title="Start free. Go deeper when you need to."
          lead="Run your first UX audit for free, then choose a plan that fits how often—and how deeply—you want to analyze experiences."
          width="sectionNarrow"
        />

        <Grid columns={3} gap={20} align="stretch" style={{ marginTop: 48 }}>
          {TIERS.map((tier) => (
            <Card key={tier.name} as="article" radius={radius.md} pad={[40, 36]} stack>
              <Row gap={16}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: 999,
                    background: color.muted,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color.fg,
                  }}
                >
                  <IconBox name={tier.icon} size="w-5" />
                </span>
                <Text font={t(400, 26, 32, 'serif')} track="display">
                  {tier.name} plan
                </Text>
              </Row>

              <Text
                as="p"
                font={t(400, 15, 25)}
                tone="muted"
                wrap="pretty"
                style={{ marginTop: 24 }}
              >
                {tier.summary}
              </Text>

              <Row align="baseline" gap={10} style={{ marginTop: 28 }}>
                <Text variant="price" style={{ letterSpacing: '-0.02em' }}>
                  {tier.price}
                </Text>
                <Text font={t(400, 15, 22)} tone="muted">
                  {tier.per}
                </Text>
              </Row>

              <Divider style={{ margin: '28px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tier.features.map((f) => (
                  <Row key={f} gap={12}>
                    <span style={{ color: color.mutedFg, display: 'inline-flex' }}>
                      <IconBox name="IconCheck" size="w-4" />
                    </span>
                    <Text variant="bodySm">{f}</Text>
                  </Row>
                ))}
              </div>

              <Spacer min={28} />

              <Button
                variant="primary"
                size="cta"
                elevation="none"
                iconEnd="IconArrowUpRight"
                className="hp-fade"
                onClick={onRunAudit}
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </Grid>

        <Row gap={20} wrap style={{ marginTop: 28 }}>
          <ArrowLink
            href="#plans"
            className="hp-link-muted"
            style={{ font: t(500, 14, 20), gap: 6 }}
          >
            Compare all plans
          </ArrowLink>
          <Text variant="bodyXs" tone="muted">
            Not sure yet? Start with a free audit. No credit card required.
          </Text>
        </Row>
      </Container>
    </Section>
  );
}
