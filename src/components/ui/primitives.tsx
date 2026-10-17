import type { CSSProperties } from 'react';

/**
 * Google Material Symbols Rounded, loaded as a stylesheet in the layout head.
 *
 * The glyph is a ligature, so the `name` is rendered as text and the font
 * substitutes the icon — which is why it needs no size prop of its own beyond
 * `fontSize`.
 *
 * `Container` and `Eyebrow` used to live here; they are now in `./layout` and
 * `./typography` alongside the rest of their families, and re-exported from the
 * `@/components/ui` barrel.
 */
export function MaterialSymbol({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <span className="material-symbols-rounded" style={style}>
      {name}
    </span>
  );
}
