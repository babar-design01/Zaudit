import {
  ArrowLink,
  Card,
  Container,
  Grid,
  IconTile,
  Row,
  Section,
  SectionHeader,
  Spacer,
  Text,
} from '@/components/ui';
import { t } from '@/design/tokens';
import { DIMENSIONS } from '@/content/homepage';

export function Dimensions() {
  return (
    <Section id="product" tone="muted">
      <Container padY={80}>
        <SectionHeader
          eyebrow="MULTI-DIMENSIONAL UX ANALYSIS"
          title="Your experience is more than how it looks."
          lead="Zaudit analyzes the key factors that shape how users understand, navigate, and interact with your website."
          width={660}
        />

        <Grid columns={2} gap={20} style={{ marginTop: 48 }}>
          {DIMENSIONS.map((d) => (
            <Card key={d.name} as="article" pad={28} gap={16}>
              <Row gap={14}>
                <IconTile icon={d.icon} />
                <Text variant="labelXl" track="tight">
                  {d.name}
                </Text>
              </Row>

              <Text as="p" font={t(400, 14, 23)} tone="fg" wrap="pretty">
                {d.desc}
              </Text>

              <Spacer />

              <ArrowLink href="#sample">Read Details</ArrowLink>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
