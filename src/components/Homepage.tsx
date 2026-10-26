'use client';

import { useEffect } from 'react';
import { ClosingCta } from '@/components/home/ClosingCta';
import { Covered } from '@/components/home/Covered';
import { Faq } from '@/components/home/Faq';
import { Features } from '@/components/home/Features';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Pricing } from '@/components/home/Pricing';
import { Problem } from '@/components/home/Problem';
import { Proof } from '@/components/home/Proof';
import { Solutions } from '@/components/home/Solutions';
import { Stories } from '@/components/home/Stories';
import { AuditDialog } from '@/components/sections/AuditDialog';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav, type Account } from '@/components/site/SiteNav';
import { useAudit } from '@/hooks/useAudit';

/**
 * The Audix homepage, built from `design/Main.dc.html` in the handoff.
 *
 * Section order is the design's: nav → hero → what you get → the problem → how
 * it works → features → what's covered → who it's for → customer stories →
 * pricing → FAQ → closing statement → footer. Every "Run free audit" opens the
 * same dialog: goal, then the run, then the report.
 */
export function Homepage({ account = null, accounts = false }: { account?: Account; accounts?: boolean } = {}) {
  const { state, setUrl, setGoal, openGoal, start, closeDialog } = useAudit();

  // The report's nav sends people here with ?audit=1 to start one.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('audit') === '1') {
      window.history.replaceState(null, '', window.location.pathname);
      openGoal();
    }
  }, [openGoal]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav onRunAudit={openGoal} account={account} accounts={accounts} />

      <AuditDialog state={state} start={start} setGoal={setGoal} close={closeDialog} />

      <main id="main">
        <Hero onRunAudit={openGoal} url={state.url} setUrl={setUrl} />
        <Proof onRunAudit={openGoal} />
        <Problem onRunAudit={openGoal} />
        <HowItWorks />
        <Features onRunAudit={openGoal} />
        <Covered onRunAudit={openGoal} />
        <Solutions onRunAudit={openGoal} />
        <Stories />
        <Pricing onRunAudit={openGoal} />
        <Faq onRunAudit={openGoal} />
        <ClosingCta onRunAudit={openGoal} />
      </main>

      <SiteFooter />
    </div>
  );
}
