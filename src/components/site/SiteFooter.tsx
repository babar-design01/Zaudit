import type { CSSProperties, ReactNode } from 'react';
import { Container, Divider, Grid, IconBox, Row, Stack, Text } from '@/components/ui';
import { color, hairline, t, text } from '@/design/tokens';

const FOOTER_LINK: CSSProperties = { font: t(400, 15, 22), color: color.fg };

const SOCIAL: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  border: hairline(),
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color.fg,
};

const PAGES = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#plans' },
];

const USEFUL = [
  { label: 'Sample Audit', href: '#sample' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const SOCIALS = [
  { label: 'Website', icon: 'IconGlobe' },
  { label: 'GitHub', icon: 'IconGithub' },
  { label: 'Email', icon: 'IconMail' },
] as const;

const CONTACTS = [
  { icon: 'IconMail', label: 'Email us', address: 'hello@zaudit.com' },
  { icon: 'IconGlobe', label: 'Support', address: 'support@zaudit.com' },
] as const;

/** A footer column: a serif heading over a stack of links. */
function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={22}>
      <Text font={t(400, 21, 26, 'serif')}>
        {title}
      </Text>
      {children}
    </Stack>
  );
}

/**
 * The footer redefines `--fg`, `--muted-fg` and `--border` on itself rather than
 * hard-coding dark values, so every token-driven component inside it inverts
 * without knowing it is on a dark field.
 */
export function SiteFooter() {
  return (
    <footer
      style={
        {
          background: '#0C0E12',
          color: '#F1F3F7',
          '--fg': '#F1F3F7',
          '--muted-fg': '#99A1AE',
          '--border': '#262B35',
        } as CSSProperties
      }
    >
      <Container style={{ padding: '72px 32px 0' }}>
        <div
          style={{
            font: text.displayNumeral,
            letterSpacing: '-0.02em',
            color: '#F1F3F7',
          }}
        >
          Zaudit
        </div>

        <Divider style={{ marginTop: 56 }} />

        <Grid
          columns="minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 1fr)"
          gap={48}
          style={{ padding: '72px 0' }}
        >
          <Stack gap={48} style={{ maxWidth: 400 }}>
            <Text as="p" variant="body" tone="fg" wrap="pretty">
              AI-powered UX auditing that finds what’s hurting your user experience and tells you
              exactly how to fix it.
            </Text>
            <Row gap={20}>
              <Text font={t(400, 21, 26, 'serif')}>Follow us</Text>
              <Row gap={10}>
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    className="hp-social"
                    href="#"
                    aria-label={s.label}
                    style={SOCIAL}
                  >
                    <IconBox name={s.icon} size="w-4" />
                  </a>
                ))}
              </Row>
            </Row>
          </Stack>

          <Column title="Pages">
            <Stack as="nav" gap={14}>
              {PAGES.map((l) => (
                <a key={l.label} className="hp-link-muted" href={l.href} style={FOOTER_LINK}>
                  {l.label}
                </a>
              ))}
            </Stack>
          </Column>

          <Column title="Useful links">
            <Stack as="nav" gap={14}>
              {USEFUL.map((l) => (
                <a key={l.label} className="hp-link-muted" href={l.href} style={FOOTER_LINK}>
                  {l.label}
                </a>
              ))}
            </Stack>
          </Column>

          <Column title="Contact us">
            <Stack gap={20}>
              {CONTACTS.map((c) => (
                <Stack key={c.label} gap={6}>
                  <Text
                    font={t(400, 15, 22)}
                    tone="fg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
                  >
                    <IconBox name={c.icon} size="w-4" />
                    {c.label}
                  </Text>
                  <a
                    className="hp-link-fg"
                    href={`mailto:${c.address}`}
                    style={{ font: t(400, 15, 22), color: color.mutedFg }}
                  >
                    {c.address}
                  </a>
                </Stack>
              ))}
            </Stack>
          </Column>
        </Grid>

        <Row
          justify="between"
          wrap
          gap={24}
          style={{ borderTop: hairline(), padding: '28px 0 32px' }}
        >
          <Text variant="caption" tone="muted">
            © 2026 Zaudit. All rights reserved.
          </Text>
          <Row gap={12}>
            <a className="hp-link-fg" href="#" style={{ font: text.caption, color: color.mutedFg }}>
              Licenses
            </a>
            <span style={{ color: color.border }}>|</span>
            <a className="hp-link-fg" href="#" style={{ font: text.caption, color: color.mutedFg }}>
              Style guide
            </a>
          </Row>
        </Row>
      </Container>
    </footer>
  );
}
