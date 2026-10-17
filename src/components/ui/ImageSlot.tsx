import type { CSSProperties } from 'react';

/**
 * Stands in for the prototype's `<image-slot>` drop zone.
 *
 * The design leaves six of these for real captures that were never supplied:
 * the proof card's annotated page, the four How It Works panels, and the anatomy
 * card. Each renders at the exact dimensions the design specifies, so dropping a
 * real screenshot in later is a matter of passing `src` — nothing else moves.
 */
export function ImageSlot({
  placeholder,
  radius = 12,
  src,
  alt,
  style,
}: {
  placeholder: string;
  radius?: number;
  src?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  const frame: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: radius,
    overflow: 'hidden',
    ...style,
  };

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- captures are arbitrary user assets
    return <img src={src} alt={alt ?? placeholder} style={{ ...frame, objectFit: 'cover', width: '100%', height: '100%' }} />;
  }

  return (
    <div
      style={{
        ...frame,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        border: '1px dashed color-mix(in oklab, var(--fg) 18%, transparent)',
        background: 'color-mix(in oklab, var(--card) 72%, transparent)',
      }}
    >
      <span
        style={{
          font: '400 13px/20px var(--font-sans)',
          color: 'var(--muted-fg)',
          textAlign: 'center',
          textWrap: 'pretty',
        }}
      >
        {placeholder}
      </span>
    </div>
  );
}
