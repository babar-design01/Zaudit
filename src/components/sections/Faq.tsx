'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Container,
  Heading,
  IconBox,
  Row,
  Section,
  Stack,
  Text,
} from '@/components/ui';
import { color, hairline, mix, radius, t } from '@/design/tokens';
import { FAQS } from '@/content/homepage';

export function Faq({ onRunAudit }: { onRunAudit: () => void }) {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq">
      <Container
        padY={80}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: 64,
          alignItems: 'start',
        }}
      >
        {/* The heading column stays put while the questions scroll past it. */}
        <Stack align="start" gap={24} style={{ position: 'sticky', top: 88 }}>
          <Text font={t(500, 14, 20)} tone="muted" style={{ letterSpacing: '0.04em' }}>
            FAQ
          </Text>
          <Heading level={2} variant="sectionTitleFaq" wrap="pretty">
            Everything you need to know before your first audit
          </Heading>
          <Text as="p" variant="body" tone="muted" wrap="pretty">
            Clear answers about how Zaudit analyzes your site, what findings look like, and how to
            act on them.
          </Text>

          <Card
            tone="primary"
            border={false}
            elevation="none"
            radius={radius.md}
            pad={24}
            gap={18}
            style={{ marginTop: 32, alignSelf: 'stretch', color: color.primaryFg }}
          >
            <Row gap={16}>
              <span
                style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  borderRadius: radius.plate,
                  background: mix(color.primaryFg, 16),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBox name="IconSparkles" size="w-6" />
              </span>
              <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                <Text font={t(400, 21, 26, 'serif')}>Still have questions?</Text>
                <Text font={t(400, 13, 19)} style={{ opacity: 0.75 }}>
                  Run a free audit and see for yourself.
                </Text>
              </Stack>
            </Row>
            <Button
              variant="onPrimary"
              size="pill"
              iconEnd="IconArrowUpRight"
              className="hp-fade"
              onClick={onRunAudit}
            >
              Try it
            </Button>
          </Card>
        </Stack>

        <div>
          {FAQS.map((f, i) => (
            <div key={f.q} style={{ borderBottom: hairline() }}>
              <button
                type="button"
                onClick={() => setOpen((cur) => (cur === i ? -1 : i))}
                aria-expanded={open === i}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 20,
                  padding: '28px 0',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: color.fg,
                  font: t(400, 17, 26),
                  letterSpacing: '-0.1px',
                }}
              >
                <span style={{ textWrap: 'pretty' }}>{f.q}</span>
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 5,
                    color: color.mutedFg,
                    transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 160ms cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'inline-flex',
                  }}
                >
                  <IconBox name="IconChevronDown" size="w-4" />
                </span>
              </button>
              {open === i && (
                <Text
                  as="p"
                  variant="body"
                  tone="muted"
                  wrap="pretty"
                  style={{ padding: '0 48px 26px 0' }}
                >
                  {f.a}
                </Text>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
