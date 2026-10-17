import { Fragment } from 'react';
import {
  Card,
  Container,
  Grid,
  IconBox,
  Section,
  SectionHeader,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import { color, radius, staticColor, t } from '@/design/tokens';
import { JOURNEY } from '@/content/homepage';

/** The four-card journey, each step separated by an arrow. */
export function Problem() {
  return (
    <Section id="problem" tone="muted">
      <Container padY={80}>
        <SectionHeader
          eyebrow="THE MISSING PIECE"
          title="You know something isn’t working. Finding out why is the hard part."
          lead="Analytics can show where users drop off. Heatmaps and recordings can show how they behave. But turning those signals into clear UX problems—and knowing what to change—still requires time, expertise, and manual analysis."
        />

        <Grid
          columns="minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr)"
          gap={20}
          align="stretch"
          style={{ marginTop: 56 }}
        >
          {JOURNEY.map((j, i) => {
            /* The emphasised step inverts: white ink and rules on a blue field. */
            const fg = j.emphasis ? staticColor.white : color.fg;
            const dim = j.emphasis ? staticColor.onPrimaryDim : color.mutedFg;
            const line = j.emphasis ? staticColor.onPrimaryLine : color.border;

            return (
              <Fragment key={j.n}>
                {i > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color.mutedFg,
                      paddingTop: 32,
                    }}
                  >
                    <IconBox name="IconArrowUpRight" size="w-4" />
                  </div>
                )}

                <Card
                  tone={j.emphasis ? 'primary' : 'card'}
                  border={line}
                  radius={radius.md}
                  elevation="none"
                  pad={24}
                  gap={14}
                  style={{ color: fg }}
                >
                  <Text variant="mono" colorValue={dim}>
                    {j.n}
                  </Text>

                  <Stack gap={6}>
                    <Text font={t(600, 15, 20)} track="snug" colorValue={fg}>
                      {j.label}
                    </Text>
                    <Text variant="label" colorValue={fg} wrap="pretty">
                      {j.lead}
                    </Text>
                  </Stack>

                  <Stack gap={6}>
                    {j.points.map((p) => (
                      <Text key={p} variant="bodyXs" colorValue={dim} wrap="pretty">
                        {p}
                      </Text>
                    ))}
                  </Stack>

                  <Spacer />

                  {j.close && (
                    <Text
                      font={t(500, 13, 20)}
                      colorValue={fg}
                      wrap="pretty"
                      style={{ paddingTop: 12, borderTop: `1px solid ${line}` }}
                    >
                      {j.close}
                    </Text>
                  )}
                </Card>
              </Fragment>
            );
          })}
        </Grid>
      </Container>
    </Section>
  );
}
