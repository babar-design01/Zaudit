'use client';

import { type MouseEvent } from 'react';
import { Eyebrow } from '@/components/site/PageKit';
import { planRequestHref } from '@/lib/plan-request';
import { FREE_AFTER_LOGIN, FREE_BEFORE_LOGIN, PLANS, priceOf } from '@/lib/plans';

/* Layout from design/Main.dc.html, with the plans read from lib/plans.ts. */

/** Every plan gets all of this, so the plans differ only in how many audits they include. */
const INCLUDED = ['Every check, on desktop and mobile', 'All findings, ranked, with fixes', 'Annotated screenshots', 'PDF export'];

function Item({ children }: { children: string }) {
  return (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', font: '400 14px/22px var(--font-sans)', color: 'var(--ink)' }}>
      <span aria-hidden="true" style={{ width: '10px', height: '10px', marginTop: '6px', flexShrink: 0, borderRadius: '2px', background: 'var(--blue)' }} />
      {children}
    </li>
  );
}

function Card({
  name,
  badge,
  price,
  per,
  summary,
  audits,
  cta,
  href,
  note,
  primary,
  onClick,
}: {
  name: string;
  badge?: string;
  price: string;
  per?: string;
  summary: string;
  audits: string[];
  cta: string;
  href: string;
  note: string;
  primary?: boolean;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <div style={{ flex: '1 1 250px', minWidth: 0, padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', background: name === 'Free' ? 'transparent' : '#FFFFFF', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
        <span style={{ font: '600 18px/24px var(--font-sans)', letterSpacing: '-0.015em' }}>{name}</span>
        {badge && (
          <span style={{ marginLeft: 'auto', background: '#E8F0FE', color: 'var(--accent-fg)', font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '2px' }}>{badge}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ font: '500 44px/1 var(--font-sans)', letterSpacing: '-0.04em', color: 'var(--ink)' }}>{price}</span>
          {per && <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--ink-secondary)' }}>{per}</span>}
        </div>
        <p style={{ margin: 0, font: '400 14px/22px var(--font-sans)', color: 'var(--ink-muted)', textWrap: 'pretty' }}>{summary}</p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...audits, ...INCLUDED].map((item) => (
          <Item key={item}>{item}</Item>
        ))}
      </ul>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <a
          href={href}
          onClick={onClick}
          data-cta={primary ? 'primary' : 'secondary'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '600 14px/20px var(--font-sans)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '16px 24px',
            borderRadius: '2px',
            ...(primary ? { background: 'var(--ink)', color: '#FFFFFF' } : { background: 'rgba(255, 255, 255, 0.18)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px rgba(20, 60, 140, 0.35)' }),
          }}
        >
          {cta}
        </a>
        <span style={{ textAlign: 'center', font: '400 12px/16px var(--font-sans)', color: 'var(--ink-muted)' }}>{note}</span>
      </div>
    </div>
  );
}

/**
 * Without accounts there is nothing to log in to and no checkout to reach, so the
 * section says only what is true today: each paid plan's button opens /contact
 * with that plan chosen, and the plan is set up by hand after a reply. Connecting
 * the database switches it to the real flow.
 */
export function Pricing({ onRunAudit, accounts = false }: { onRunAudit: () => void; accounts?: boolean }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <section id="plans" style={{ borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px clamp(16px, 5.56vw, 80px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px 64px' }}>
          <div style={{ flex: '1 1 520px', maxWidth: '680px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Eyebrow>Pricing</Eyebrow>
            <h2 style={{ margin: 0, font: '500 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)', letterSpacing: '-0.03em', textWrap: 'pretty' }}>Less than the cost of one lost customer.</h2>
          </div>
          <p style={{ margin: 0, flex: '0 1 440px', minWidth: 0, font: '400 16px/28px var(--font-sans)', color: 'var(--ink-muted)', textWrap: 'pretty' }}>
            {accounts
              ? `Your first audit costs nothing and shows everything. Log in for ${FREE_AFTER_LOGIN} more, then choose a plan for how often you audit.`
              : 'Your first audit costs nothing and shows everything. Then choose a plan for how often you audit.'}
          </p>
        </div>

        <div style={{ marginTop: '48px', background: '#EEF1F7', border: '1px solid #E3E7EF', borderRadius: '8px', padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'stretch' }}>
          <Card
            name="Free"
            price="$0"
            summary="Try it on your own site"
            audits={accounts ? [`${FREE_BEFORE_LOGIN} audit with just your email`, `${FREE_AFTER_LOGIN} more when you log in`] : ['A free audit with just your email']}
            cta="Run free audit"
            href="/?audit=1"
            note="No card required"
            primary
            onClick={run}
          />
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              name={plan.name}
              // 'agency' is the plan shown as Pro.
              badge={plan.id === 'agency' ? 'Recommended' : undefined}
              price={priceOf(plan)}
              per="/ month"
              summary={plan.summary}
              audits={[`${plan.auditsPerMonth} audits a month`]}
              cta={`Get ${plan.name}`}
              href={accounts ? '/account' : planRequestHref(plan)}
              note={accounts ? 'Cancel anytime' : "We'll set it up within one working day"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
