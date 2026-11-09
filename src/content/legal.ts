/**
 * Shared facts for /privacy and /terms.
 *
 * Both pages are a starting draft, not legal advice. Have a lawyer check them
 * before relying on them, especially for EU or UK customers (GDPR).
 *
 * Every business fact below is Babar's own answer (9 Nov 2026). Change it here
 * and both pages follow.
 */

/** Change this whenever either page changes in substance. */
export const LEGAL_UPDATED = '9 November 2026';
export const LEGAL_UPDATED_ISO = '2026-11-09';

export const LEGAL = {
  /** The business named as data controller and contracting party. */
  name: 'ProCurveUX',
  address: 'Lahore, Pakistan',
  /** Support, privacy and plan requests. */
  email: 'sales@zeeframes.com',
  governingLaw: 'Pakistan',
  courts: 'the courts of Lahore, Pakistan',
  /** How paid plans are invoiced and paid. */
  payment: 'Payoneer',
  responseTime: '30 days',
  /** Where Vercel runs the site and stores reports: no region is set, so Vercel's default. */
  region: 'the United States',
  retention: {
    reports: '12 months after the audit',
    runLog: '12 months',
    messages: '24 months',
    accountAfter: '12 months after it ends',
    invoices: '6 years',
  },
  /** The most we owe a free user, in place of fees paid. */
  freeLiabilityCap: 'USD 50',
} as const;
