'use client';

import { Anatomy } from '@/components/sections/Anatomy';
import { AuditDialog } from '@/components/sections/AuditDialog';
import { Audiences } from '@/components/sections/Audiences';
import { AuditSummary } from '@/components/sections/AuditSummary';
import { Dimensions } from '@/components/sections/Dimensions';
import { Faq } from '@/components/sections/Faq';
import { FinalCta } from '@/components/sections/FinalCta';
import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Pricing } from '@/components/sections/Pricing';
import { Problem } from '@/components/sections/Problem';
import { ProductProof } from '@/components/sections/ProductProof';
import { Testimonials } from '@/components/sections/Testimonials';
import { AnnouncementBar, SiteNav, type Account } from '@/components/site/SiteNav';
import { SiteFooter } from '@/components/site/SiteFooter';
import { focusHero, useAudit } from '@/hooks/useAudit';

/**
 * The Zaudit homepage, built from `Homepage Veltrex.dc.html`.
 *
 * Section order is the design's: hero → product proof → the problem → (live audit
 * results, once one has run) → how it works → what we analyze → who it's for →
 * testimonials → anatomy → pricing → FAQ → final CTA → footer.
 */
export function Homepage({ account = null, accounts = false }: { account?: Account; accounts?: boolean } = {}) {
  const { state, setUrl, setGoal, openGoal, start, reset, closeDialog } = useAudit();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <AnnouncementBar />
      <SiteNav onRunAudit={focusHero} account={account} accounts={accounts} />

      {/* The run itself happens in a dialog over the page. */}
      <AuditDialog state={state} start={start} setGoal={setGoal} close={closeDialog} />

      <Hero state={state} setUrl={setUrl} start={openGoal} reset={reset} />
      <ProductProof />
      <Problem />

      {state.stage === 'done' && state.result && <AuditSummary result={state.result} />}

      <HowItWorks />
      <Dimensions />
      <Audiences onRunAudit={focusHero} />
      <Testimonials />
      <Anatomy onRunAudit={focusHero} />
      <Pricing onRunAudit={focusHero} />
      <Faq onRunAudit={focusHero} />
      <FinalCta onRunAudit={focusHero} />
      <SiteFooter />
    </div>
  );
}
