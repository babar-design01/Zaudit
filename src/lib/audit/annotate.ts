import sharp, { type Sharp } from 'sharp';
import { VIEWPORT } from './contract';
import { SEVERITY_LABEL, type Annotation, type Finding } from './types';

/**
 * Turning evidence into pictures.
 *
 * Every piece of element-level evidence already carries a box on the
 * first-screen capture. Here each becomes a crop around that box, with the box's
 * position inside the crop as percentages, so the interface draws the outline
 * and pin as DOM — crisp at any size, themed, and aligned without burning a
 * rectangle into the pixels.
 *
 * Document-level evidence (a missing `lang`, a zoom-blocking viewport tag) is
 * about the whole page; it gets no crop, because pointing at an arbitrary
 * element would be worse than pointing at none.
 */

const PAD_X = 120;
const PAD_Y = 90;
const MAX_W = 720;
const MAX_H = 460;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const pct = (n: number) => n.toFixed(2) + '%';

async function cropAround(image: Sharp, box: [number, number, number, number]) {
  const [bx, by, bw, bh] = box;
  const W = VIEWPORT.width;
  const H = VIEWPORT.height;
  const left = clamp(Math.round(bx - PAD_X), 0, W - 1);
  const top = clamp(Math.round(by - PAD_Y), 0, H - 1);
  const width = clamp(Math.round(bw + PAD_X * 2), 16, W - left);
  const height = clamp(Math.round(bh + PAD_Y * 2), 16, H - top);
  if (width < 16 || height < 16) return null;
  const scale = Math.min(1, MAX_W / width, MAX_H / height);
  const buffer = await image
    .clone()
    .extract({ left, top, width, height })
    .resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), fit: 'fill' })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
  return {
    data: 'data:image/jpeg;base64,' + buffer.toString('base64'),
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    box: {
      left: pct(((bx - left) / width) * 100),
      top: pct(((by - top) / height) * 100),
      width: pct((Math.min(bw, width) / width) * 100),
      height: pct((Math.min(bh, height) / height) * 100),
    },
  };
}

/**
 * Pins, numbered in the order findings are listed — confirmed before review,
 * most severe first — so pin 1 is the worst thing the audit can point at.
 */
export async function annotate(
  screenshot: Buffer,
  findings: Finding[],
  { perFinding = 3, maxBytes = 6_000_000 }: { perFinding?: number; maxBytes?: number } = {},
): Promise<{ findings: Finding[]; pins: Annotation[] }> {
  const image = sharp(screenshot);
  const pins: Annotation[] = [];
  const seen = new Set<string>();
  const out: Finding[] = [];
  let bytes = 0;

  /*
   * Every finding earns one picture before any finding earns a second: the
   * report shows what each one looks like, and a finding with five instances
   * must not spend the budget that the next five findings need. The budget is
   * in bytes rather than in crops, because the result is carried in one
   * response and held in memory.
   */
  const rounds = Math.max(1, perFinding);
  const taken = new Map<string, number>();
  const plan: { f: Finding; e: Finding['evidence'][number]; i: number; of: number }[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const f of findings) {
      const drawable = f.evidence.filter((e) => !e.documentLevel);
      const next = taken.get(f.id) ?? 0;
      if (next > round || next >= drawable.length) continue;
      plan.push({ f, e: drawable[next], i: next, of: drawable.length });
      taken.set(f.id, next + 1);
    }
  }

  const byFinding = new Map<string, Annotation[]>();
  for (const { f, e, i, of } of plan) {
    if (bytes >= maxBytes) break;
    {
      // Two findings can be about the same element — a target too small and a
      // shadow off the ramp. Each still gets its own picture; only the pins on
      // the overview are deduplicated, since two pins on one box is one pin.
      const key = e.bbox.join(',');
      const crop = await cropAround(image, e.bbox).catch(() => null);
      if (!crop) continue;
      bytes += crop.data.length;
      const drawable = { length: of };
      const [x, y, w, h] = e.bbox;
      const a: Annotation = {
        index: pins.length + 1,
        findingId: f.id,
        evidenceId: e.evidenceId,
        severity: SEVERITY_LABEL[f.severity],
        image: crop.data,
        width: crop.width,
        height: crop.height,
        box: crop.box,
        pageBox: {
          left: pct((x / VIEWPORT.width) * 100),
          top: pct((y / VIEWPORT.height) * 100),
          width: pct((w / VIEWPORT.width) * 100),
          height: pct((h / VIEWPORT.height) * 100),
        },
        label: drawable.length > 1 ? `${f.name} (${i + 1} of ${drawable.length})` : f.name,
        selector: e.selector,
      };
      byFinding.set(f.id, [...(byFinding.get(f.id) ?? []), a]);
      if (!seen.has(key)) {
        seen.add(key);
        pins.push(a);
      }
    }
  }

  // Pins are numbered in reading order, so pin 1 is the first one in the report.
  pins.sort((a, b) => findings.findIndex((f) => f.id === a.findingId) - findings.findIndex((f) => f.id === b.findingId));
  pins.forEach((p, i) => {
    p.index = i + 1;
  });
  for (const f of findings) out.push({ ...f, annotations: byFinding.get(f.id) ?? [] });
  return { findings: out, pins };
}

/** The first screen, scaled for the results column. */
export async function overview(screenshot: Buffer, width = 760) {
  try {
    const buffer = await sharp(screenshot)
      .resize({ width, fit: 'inside' })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    return {
      data: 'data:image/jpeg;base64,' + buffer.toString('base64'),
      width,
      height: Math.round((VIEWPORT.height / VIEWPORT.width) * width),
    };
  } catch {
    return null;
  }
}
