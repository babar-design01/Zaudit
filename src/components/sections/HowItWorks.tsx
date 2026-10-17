import {
  Card,
  Container,
  IconTile,
  ImageSlot,
  Section,
  SectionHeader,
  Stack,
  Text,
} from '@/components/ui';
import { HOW_CARDS } from '@/content/homepage';

/** Four cards that stack on top of one another as the section scrolls past. */
export function HowItWorks() {
  return (
    <Section id="how">
      <Container padY={96}>
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="From one URL to actionable UX insights."
          lead="Enter your website and let Zaudit analyze the experience. Turn potential UX issues into structured findings with evidence, context, and clear next steps."
          align="center"
          width={680}
        />

        <Stack gap={40} style={{ marginTop: 64 }}>
          {HOW_CARDS.map((c) => (
            <Card
              key={c.n}
              elevation="sm"
              clip
              style={{
                position: 'sticky',
                top: c.top,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
              }}
            >
              <Stack gap={18} justify="center" style={{ padding: 48 }}>
                <IconTile icon={c.icon} variant="gradient" size={56} fill={c.grad} />
                <Text variant="monoLabel" tone="muted">
                  {c.n} — {c.name}
                </Text>
                <Text variant="cardTitle" track="display" wrap="pretty">
                  {c.title}
                </Text>
                <Text as="p" variant="body" tone="muted" width="card" wrap="pretty">
                  {c.body}
                </Text>
              </Stack>

              <div style={{ background: c.grad, padding: 48 }}>
                <div style={{ position: 'relative', height: 340 }}>
                  <ImageSlot placeholder={c.placeholder} radius={16} />
                </div>
              </div>
            </Card>
          ))}
        </Stack>
      </Container>
    </Section>
  );
}
