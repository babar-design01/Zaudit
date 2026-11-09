import type { Cover, CoverBars, Post } from '../blog';
import * as contrast from './color-contrast-ratio-wcag';
import * as layoutshift from './cumulative-layout-shift-fix';
import * as heuristics from './heuristic-evaluation-website';
import * as targets from './tap-target-size-guidelines';
import * as wcag22 from './wcag-2-2-new-success-criteria';
import * as zeeframes from './zeeframes-ux-audit-to-redesign';

/*
 * Articles kept one per file, each exporting its `post` and, when the cover
 * draws a headline figure, its `motif`. Listed newest first; blog.ts puts them
 * ahead of the older articles it holds itself.
 */
const FILES: { post: Post; motif?: CoverBars }[] = [zeeframes, heuristics, layoutshift, targets, contrast, wcag22];

export const NEW_POSTS: Post[] = FILES.map((f) => f.post);

export const NEW_MOTIFS: Partial<Record<Cover, CoverBars>> = Object.fromEntries(FILES.filter((f) => f.motif).map((f) => [f.post.cover, f.motif]));
