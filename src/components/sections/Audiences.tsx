'use client';

import {
  ArrowLink,
  Button,
  Card,
  Container,
  Grid,
  Row,
  Section,
  SectionHeader,
  Spacer,
  Text,
} from '@/components/ui';
import { Dot } from '@/components/ui';
import { t } from '@/design/tokens';
import { AUDIENCES } from '@/content/homepage';

export function Audiences({ onRunAudit }: { onRunAudit: () => void }) {
  return (
    <Section id="solutions">
      <Container padY={80}>
        <SectionHeader
          eyebrow="WHO IT’S FOR"
          eyebrowVariant="plain"
          title="Built for people who care about better experiences."
          lead="Whether you’re building your own product or improving one for a client, Zaudit helps you uncover UX issues, understand what matters, and decide what to improve next."
          width={680}
        />

        {/* Each card is offset a little further down than the last. */}
        <Grid columns={4} gap={20} align="start" style={{ marginTop: 56 }}>
          {AUDIENCES.map((a) => (
            <Card
              key={a.short}
              as="article"
              pad={28}
              gap={10}
              elevation="sm"
              style={{ marginTop: a.offset, minHeight: 340 }}
            >
              <Row align="start" justify="between" gap={12}>
                <Text variant="audienceTitle" track="display" wrap="pretty">
                  {a.short}
                </Text>
                <Dot variant="ring" tone={a.dot} style={{ marginTop: 6 }} />
              </Row>

              <Spacer />

              <Text variant="labelLg" track="snug" wrap="pretty">
                {a.headline}
              </Text>
              <Text as="p" font={t(400, 13, 21)} tone="muted" wrap="pretty">
                {a.body}
              </Text>
              <ArrowLink href="#plans" size="sm" style={{ marginTop: 6, whiteSpace: 'nowrap' }}>
                {a.cta}
              </ArrowLink>
            </Card>
          ))}
        </Grid>

        <Row justify="between" wrap gap={24} style={{ marginTop: 48 }}>
          <Text variant="quote" wrap="pretty">
            Different roles. One shared goal: a better user experience.
          </Text>
          <Button variant="primary" size="lg" iconEnd="IconArrowUpRight" onClick={onRunAudit}>
            Run Free UX Audit
          </Button>
        </Row>
      </Container>
    </Section>
  );
}
