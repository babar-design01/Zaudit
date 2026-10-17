'use client';

import { Row, Stack, Text } from '@/components/ui';
import { SEVERITY_COLORS } from '@/components/ui/SeverityTag';
import { color, hairline, radius, staticColor, t } from '@/design/tokens';
import type { Annotation } from '@/lib/audit/types';

/**
 * A finding, shown rather than described.
 *
 * The image is a crop of the captured page around the element at fault; the
 * outline and the numbered pin are drawn over it as DOM, positioned by the
 * percentages the annotation carries. Keeping them out of the pixels is what
 * lets them stay sharp at any size, follow the theme, and match the severity
 * colour the rest of the page already uses.
 */
export function AnnotationShot({
  annotation,
  /** Overrides the header line. Inside a finding card the title is already above. */
  caption,
}: {
  annotation: Annotation;
  caption?: string;
}) {
  const tone = SEVERITY_COLORS[annotation.severity] ?? SEVERITY_COLORS.Medium;
  /* Medium and Low are deliberately neutral on the severity scale, which is too
     quiet to find on a screenshot — so the marker always uses the accent. */
  const marker = annotation.severity === 'Critical' || annotation.severity === 'High'
    ? color.destructive
    : color.primary;

  return (
    <Stack
      gap={0}
      style={{
        border: hairline(),
        borderRadius: radius.md,
        overflow: 'hidden',
        background: color.card,
      }}
    >
      <Row
        gap={10}
        style={{ padding: '10px 14px', borderBottom: hairline(), background: color.muted }}
      >
        <Pin n={annotation.index} tone={marker} />
        <Text variant="labelSm" wrap="pretty" style={{ minWidth: 0 }}>
          {caption ?? annotation.label}
        </Text>
      </Row>

      <div style={{ position: 'relative', background: staticColor.white, lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 crop of the audited page */}
        <img
          src={annotation.image}
          alt={`Screenshot of the audited page showing: ${annotation.label}`}
          width={annotation.width}
          height={annotation.height}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* The element at fault. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: annotation.box.left,
            top: annotation.box.top,
            width: annotation.box.width,
            height: annotation.box.height,
            border: `2px solid ${marker}`,
            borderRadius: 3,
            boxShadow: `0 0 0 3px color-mix(in oklab, ${marker} 22%, transparent)`,
            pointerEvents: 'none',
          }}
        />

        {/* The pin sits on the outline's top-left corner, nudged outside it. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: annotation.box.left,
            top: annotation.box.top,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <Pin n={annotation.index} tone={marker} raised />
        </span>
      </div>

      {annotation.selector && (
        <Text
          variant="monoXs"
          tone="muted"
          style={{
            display: 'block',
            padding: '8px 14px',
            borderTop: hairline(),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {annotation.selector}
        </Text>
      )}
    </Stack>
  );
}

/** The numbered marker tying a note to a place on the page. */
function Pin({ n, tone, raised }: { n: number; tone: string; raised?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: 999,
        background: tone,
        color: staticColor.white,
        font: t(500, 12, 22, 'mono'),
        ...(raised
          ? { border: `2px solid ${staticColor.white}`, boxShadow: '0 1px 6px rgba(0,0,0,0.35)' }
          : null),
      }}
    >
      {n}
    </span>
  );
}
