import { Card, Container, Heading, Row, Section, Spacer, Stack, Text } from '@/components/ui';
import { color, motion, radius, t } from '@/design/tokens';
import { TESTIMONIALS_LOOP } from '@/content/homepage';

/** A marquee of quotes. The list is doubled in `content` so the loop is seamless. */
export function Testimonials() {
  return (
    <Section id="testimonials" clip>
      <div style={{ padding: '96px 0 88px' }}>
        <Container
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <Text font={t(400, 15, 22)} tone="muted">
            Our testimonials
          </Text>
          <Heading level={2} variant="sectionTitleLoose" wrap="balance">
            Real feedback from teams focused on better experiences
          </Heading>
        </Container>

        <Row
          gap={24}
          align="stretch"
          style={{
            marginTop: 64,
            width: 'max-content',
            paddingRight: 24,
            animation: motion.marquee,
          }}
        >
          {TESTIMONIALS_LOOP.map((tm, i) => (
            <Card
              key={`${tm.brand}-${i}`}
              as="article"
              radius={radius.md}
              pad={48}
              style={{
                width: 880,
                flexShrink: 0,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 300px',
                gap: 48,
                alignItems: 'stretch',
              }}
            >
              <Stack>
                <Text variant="quoteBrand" italic tone="muted">
                  {tm.brand}
                </Text>
                <Text as="p" variant="lead" wrap="pretty" style={{ marginTop: 28 }}>
                  {tm.quote}
                </Text>
                <Spacer min={32} />
                <Text variant="quoteName">{tm.name}</Text>
                <Text font={t(400, 14, 20)} tone="muted" style={{ marginTop: 6 }}>
                  {tm.role}
                </Text>
              </Stack>
              <div style={{ borderRadius: radius.plate, background: color.muted, minHeight: 340 }} />
            </Card>
          ))}
        </Row>
      </div>
    </Section>
  );
}
