'use client';

import { Button, Container, Heading, Section, Stack, Text } from '@/components/ui';

export function FinalCta({ onRunAudit }: { onRunAudit: () => void }) {
  return (
    <Section tone="primary" divided={false}>
      <Container
        padY={128}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          textAlign: 'center',
        }}
      >
        <Heading level={2} variant="displayCta" tone="inverse" wrap="balance">
          Audit with <em style={{ fontStyle: 'italic' }}>confidence</em>
        </Heading>
        <Text as="p" variant="leadCta" tone="onPrimary" width="prose" wrap="pretty">
          See potential UX issues, understand why they matter, and discover what to improve next.
        </Text>
        <Button
          variant="ink"
          size="xl"
          radius={12}
          iconEnd="IconArrowUpRight"
          className="hp-cta-dark"
          onClick={onRunAudit}
          style={{ marginTop: 20 }}
        >
          Run Free UX Audit
        </Button>
      </Container>
    </Section>
  );
}
