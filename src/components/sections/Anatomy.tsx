'use client';

import {
  ArrowLink,
  Card,
  Container,
  Dot,
  Grid,
  Heading,
  ImageSlot,
  Row,
  Section,
  Stack,
  Text,
} from '@/components/ui';
import { radius } from '@/design/tokens';
import { ANATOMY } from '@/content/homepage';

export function Anatomy({ onRunAudit }: { onRunAudit: () => void }) {
  return (
    <Section id="sample" tone="muted">
      <Container padY={80}>
        <Card
          radius={radius.md}
          elevation="sm"
          pad={[64, 56]}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.15fr) minmax(0, 1fr)',
            gap: 56,
            alignItems: 'center',
          }}
        >
          <Stack gap={20}>
            <Text variant="labelMd" track="snug">
              Every finding includes
            </Text>
            <Stack gap={14}>
              {ANATOMY.map((item) => (
                <Row key={item} gap={12} align="baseline">
                  <Dot variant="bullet" style={{ transform: 'translateY(-3px)' }} />
                  <Text variant="bodySm" wrap="pretty">
                    {item}
                  </Text>
                </Row>
              ))}
            </Stack>
          </Stack>

          <div style={{ position: 'relative', height: 360 }}>
            <ImageSlot placeholder="Drop a sample finding capture" radius={12} />
          </div>

          <Stack gap={18}>
            <Heading level={2} variant="cardTitleLg" wrap="pretty">
              Severity, confidence, and a fix you can hand to a developer.
            </Heading>
            <Text as="p" variant="body" tone="muted" wrap="pretty">
              Every finding is a structured record: severity derived from the failing check,
              confidence stated separately, impact weighed against effort, and a written fix with
              specific values—not “consider improving contrast”.
            </Text>
            <ArrowLink onClick={onRunAudit} size="lg" underline style={{ marginTop: 8 }}>
              Run a free audit
            </ArrowLink>
          </Stack>
        </Card>
      </Container>
    </Section>
  );
}
