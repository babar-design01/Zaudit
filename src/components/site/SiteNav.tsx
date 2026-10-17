'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Card, IconBox, Row, Text } from '@/components/ui';
import { color, hairline, layout, mix, radius, t, text } from '@/design/tokens';
import { SOLUTIONS } from '@/content/homepage';

const NAV_LINK: CSSProperties = {
  font: text.label,
  color: color.mutedFg,
  padding: '6px 10px',
  borderRadius: radius.sm,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how' },
];

const LINKS_AFTER = [
  { label: 'Sample Audit', href: '#sample' },
  { label: 'Pricing', href: '#plans' },
];

export function AnnouncementBar() {
  return (
    <div
      style={{
        background: color.primary,
        color: '#fff',
        textAlign: 'center',
        padding: '7px 16px',
        font: t(600, 12, 16),
      }}
    >
      No credit card required · Get your first findings before signup
    </div>
  );
}

export function SiteNav({ onRunAudit }: { onRunAudit: () => void }) {
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: mix(color.bg, 88),
        backdropFilter: 'blur(10px)',
        borderBottom: hairline(),
      }}
    >
      <Row
        gap={24}
        style={{
          maxWidth: layout.container,
          margin: '0 auto',
          padding: `0 ${layout.gutter}px`,
          height: layout.navHeight,
        }}
      >
        <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-height wordmark, no layout shift to optimize */}
          <img src="/zaudit-logo.png" alt="Zaudit" style={{ height: 22, width: 'auto', display: 'block' }} />
        </a>

        <Row as="nav" gap={2} justify="center" style={{ flex: 1, minWidth: 0 }}>
          {LINKS.map((l) => (
            <a key={l.label} className="hp-navlink" href={l.href} style={NAV_LINK}>
              {l.label}
            </a>
          ))}

          {/* Solutions opens on hover; the 6px padding above the panel keeps the
              pointer inside the hover region as it travels down to the menu. */}
          <div
            style={{ position: 'relative', flexShrink: 0 }}
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <a
              href="#solutions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                font: text.label,
                color: solutionsOpen ? color.fg : color.mutedFg,
                padding: '6px 10px',
                borderRadius: radius.sm,
                background: solutionsOpen ? color.accent : 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              Solutions
              <IconBox name="IconChevronDown" size="w-3" />
            </a>

            {solutionsOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 6, width: 244 }}>
                <Card
                  tone="bare"
                  radius={radius.md}
                  elevation="md"
                  pad={4}
                  gap={2}
                  style={{ background: color.popover }}
                >
                  {SOLUTIONS.map((s) => (
                    <a
                      key={s.label}
                      className="hp-menu-row"
                      href="#solutions"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        padding: '8px 10px',
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text variant="label" tone="fg">
                        {s.label}
                      </Text>
                      <Text font={t(400, 12, 16)} tone="muted">
                        {s.desc}
                      </Text>
                    </a>
                  ))}
                </Card>
              </div>
            )}
          </div>

          {LINKS_AFTER.map((l) => (
            <a key={l.label} className="hp-navlink" href={l.href} style={NAV_LINK}>
              {l.label}
            </a>
          ))}
        </Row>

        <Row gap={8}>
          <a
            className="hp-link-fg"
            href="#"
            style={{ font: text.label, color: color.mutedFg, whiteSpace: 'nowrap' }}
          >
            Log in
          </a>
          <Button variant="primary" size="sm" iconEnd="IconArrowUpRight" onClick={onRunAudit}>
            Run Free Audit
          </Button>
        </Row>
      </Row>
    </header>
  );
}
