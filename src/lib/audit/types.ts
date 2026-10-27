import type { ContractFinding, PageTypeResult } from './contract';
import type { CriterionReport } from './evaluate';
import type { Band, GoalId, Method, Platform, Severity, Verdict } from './framework';
import type { PillarScore, Priority } from './score';

export type { BBox, ContractFinding, Evidence, PageType, PageTypeResult, SeverityLevel } from './contract';
export type { Band, GoalId, Method, Platform, Severity, Verdict } from './framework';
export type { CriterionReport } from './evaluate';
export type { PillarScore, Priority } from './score';

/** The old four-step label, kept for the severity tag the interface already draws. */
export type SeverityLabel = 'Critical' | 'High' | 'Medium' | 'Low';

export const SEVERITY_LABEL: Record<ContractFinding['severity'], SeverityLabel> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * A finding, shown rather than described: a crop of the first-screen capture
 * around one piece of its evidence, with the element's box inside the crop as
 * percentages so the outline stays aligned at any display size.
 */
export type Annotation = {
  index: number;
  findingId: string;
  evidenceId: string;
  severity: SeverityLabel;
  image: string;
  width: number;
  height: number;
  box: { left: string; top: string; width: string; height: string };
  pageBox: { left: string; top: string; width: string; height: string };
  label: string;
  selector: string;
};

export type Finding = ContractFinding & {
  annotations: Annotation[];
  /**
   * Where it came from. Measured findings are the engine's checks; expert
   * findings are the model reading the page the way an auditor does — always
   * pinned to elements on the page, and never part of the score.
   */
  source?: 'measured' | 'expert';
  /** An expert finding in the auditor's own shape. */
  expert?: ExpertNote;
};

/** How an auditor writes a finding: what is wrong, what it costs, what to do. */
export type ExpertNote = {
  issue: string;
  impact: string;
  solution: string;
  bucket: ExpertBucket;
  device: 'desktop' | 'mobile';
  area: string;
};

export type ExpertBucket = 'fix' | 'improve' | 'idea';

/** The four-way read an audit opens with. */
export type Takeaways = { good: string[]; improve: string[]; fix: string[]; ideas: string[] };

/** What a reviewer has to do by hand, because one page load cannot settle it. */
export type ReviewerTask = {
  criterionId: string;
  criterion: string;
  pillar: string;
  pillarName: string;
  task: string;
  why: string;
  severityIfFailed: Severity;
};

export type WorkingItem = {
  criterionId: string;
  criterion: string;
  pillar: string;
  pillarName: string;
  evidenceId: string;
  text: string;
};

export type AuditResult = {
  /** Short, stable id for this run — the address of its report page. */
  id: string;
  url: string;
  finalUrl: string;
  fetchedAt: string;
  /** How long the audit took, in milliseconds. */
  tookMs: number;

  goal: { id: GoalId; name: string; blurb: string; heavier: string[]; toggles: string[] };
  platforms: Platform[];
  pageType: PageTypeResult;

  /** 0–100 across the assessed criteria, weighted by the goal. Null when nothing could be assessed. */
  overall: number | null;
  band: Band | null;
  /** One paragraph stating what the score is a score of. */
  scoreBasis: string;

  /** What this page is for, in a sentence — every finding is judged against it. */
  pageGoal: string | null;
  /** The auditor's read of the page, when the model ran. */
  expert: { ran: boolean; error: string | null; summary: string | null; takeaways: Takeaways | null };

  pillars: PillarScore[];
  /** The five fixes worth doing first, ranked by severity × frequency × goal weight. */
  priorities: Priority[];

  findings: Finding[];
  review: Finding[];
  counts: Record<Severity, number>;
  criteria: CriterionReport[];
  reviewerTasks: ReviewerTask[];
  whatWorks: WorkingItem[];

  coverage: {
    assessed: number;
    total: number;
    byMethod: Record<Method, { assessed: number; total: number }>;
    /** Verdict counts across every criterion in scope. */
    verdicts: Record<Verdict, number>;
  };
  /** Occurrences dropped for incomplete evidence. */
  discarded: number;

  screenshot: { data: string; width: number; height: number } | null;
  annotations: Annotation[];
  summary: string | null;

  model: {
    available: boolean;
    classified: boolean;
    reviewed: boolean;
    error: string | null;
    rejected: string[];
  };

  /** How the page was read, in one line. */
  provenance: string;
  fetchNote: string | null;
  captureNote: string | null;
};

/** One line of the audit route's NDJSON stream. */
export type AuditEvent =
  | { type: 'stage'; index: number }
  | { type: 'ping' }
  /** What the run cost, and whether it was given back. Only when accounts are on. */
  | { type: 'credits'; left: number | null; refunded?: boolean }
  | { type: 'result'; result: AuditResult }
  /** `action` is what would fix it: sign in, or top up. */
  | { type: 'error'; message: string; quota: boolean; action?: 'signin' | 'buy' };
