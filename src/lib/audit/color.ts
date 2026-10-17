/**
 * Colour arithmetic for the contrast rules.
 *
 * Ratios follow WCAG 2.x relative luminance exactly. Suggested replacements are
 * searched in OKLab, which is perceptually even: moving lightness there changes
 * how light a colour looks without dragging its hue, so the suggestion reads as
 * "the same colour, darker" rather than a different colour.
 */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB | null {
  const m = hex.trim().replace(/^#/, '');
  const full =
    m.length === 3 || m.length === 4
      ? m
          .slice(0, 3)
          .split('')
          .map((c) => c + c)
          .join('')
      : m.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

export function rgbToHex([r, g, b]: RGB): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Two decimals, the precision the ratio is reported at. */
export function ratio(a: RGB, b: RGB): number {
  return Math.round(contrast(a, b) * 100) / 100;
}

/* ------------------------------------------------------------------- oklab */

type Lab = [number, number, number];

function toOklab([r, g, b]: RGB): Lab {
  const lr = channel(r);
  const lg = channel(g);
  const lb = channel(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    const c = Math.max(0, Math.min(1, v));
    const s8 = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(s8 * 255);
  }) as RGB;
}

function distance(a: RGB, b: RGB): number {
  const x = toOklab(a);
  const y = toOklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/* ---------------------------------------------------------------- deltaE */

/** CIE L*a*b* (D65), the space deltaE is defined in. */
export function toLab([r, g, b]: RGB): Lab {
  const lr = channel(r);
  const lg = channel(g);
  const lb = channel(b);
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * CIEDE2000 colour difference. Under about 1 is invisible; the catalog treats
 * anything under 3 as the same colour.
 */
export function deltaE(a: RGB, b: RGB): number {
  const [L1, a1, b1] = toLab(a);
  const [L2, a2, b2] = toLab(b);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (x: number, y: number) => (x === 0 && y === 0 ? 0 : (Math.atan2(y, x) / rad + 360) % 360);
  const h1p = hp(a1p, b1);
  const h2p = hp(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lmp = (L1 + L2) / 2;
  const Cmp = (C1p + C2p) / 2;
  let hmp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hmp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    else hmp = (h1p + h2p) / 2;
  }
  const T = 1 - 0.17 * Math.cos((hmp - 30) * rad) + 0.24 * Math.cos(2 * hmp * rad) + 0.32 * Math.cos((3 * hmp + 6) * rad) - 0.2 * Math.cos((4 * hmp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hmp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lmp - 50) ** 2) / Math.sqrt(20 + (Lmp - 50) ** 2);
  const Sc = 1 + 0.045 * Cmp;
  const Sh = 1 + 0.015 * Cmp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** Hue in degrees, chroma and lightness in OKLCh — for grouping colours into ramps. */
export function oklch(c: RGB): { L: number; C: number; h: number } {
  const [L, a, b] = toOklab(c);
  return { L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 };
}

/* -------------------------------------------------------------- suggestion */

export type Suggestion = {
  hex: string;
  ratio: number;
  /**
   * `palette` — a colour the page already uses. `computed` — no colour on the
   * page reached the target, so this one was derived by moving lightness.
   */
  source: 'palette' | 'computed';
};

/**
 * The closest colour to `fg` that reaches `target` against `bg`.
 *
 * The catalog asks for "the nearest value on the brand ramp". There is no brand
 * ramp to read, but the page's own palette is measured, so a colour it already
 * uses is preferred; only when none qualifies is one computed, and the result
 * says which it is.
 */
export function suggestColor(fg: RGB, bg: RGB, target: number, palette: string[] = []): Suggestion {
  // A hair over the target, so a value that rounds to exactly 4.5 is not
  // suggested as a fix and then measured as a fail.
  const goal = target + 0.05;

  const fromPalette = palette
    .map(hexToRgb)
    .filter((c): c is RGB => !!c)
    .filter((c) => contrast(c, bg) >= goal)
    .map((c) => ({ c, d: distance(c, fg) }))
    // Only a colour recognisably related to the original is a "nearest value";
    // a black suggested for a pale blue is a different design decision.
    .filter((x) => x.d <= 0.35)
    .sort((a, b) => a.d - b.d)[0];

  if (fromPalette) {
    return { hex: rgbToHex(fromPalette.c), ratio: ratio(fromPalette.c, bg), source: 'palette' };
  }

  const [L, a, b] = toOklab(fg);
  const darken = luminance(bg) > 0.18;
  for (let step = 1; step <= 200; step += 1) {
    const nextL = darken ? L - step * 0.005 : L + step * 0.005;
    if (nextL < 0 || nextL > 1) break;
    const candidate = fromOklab([nextL, a, b]);
    if (contrast(candidate, bg) >= goal) {
      return { hex: rgbToHex(candidate), ratio: ratio(candidate, bg), source: 'computed' };
    }
  }
  const extreme: RGB = darken ? [0, 0, 0] : [255, 255, 255];
  return { hex: rgbToHex(extreme), ratio: ratio(extreme, bg), source: 'computed' };
}

/** Parses the `rgb(...)`/`#hex` strings axe-core and the probes report. */
export function parseColor(s: string | null | undefined): RGB | null {
  if (!s) return null;
  const t = s.trim();
  if (t.startsWith('#')) return hexToRgb(t);
  const m = t.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  return m ? ([+m[1], +m[2], +m[3]] as RGB) : null;
}
