import type { CSSProperties } from 'react';
import { ICONS, type IconName } from './icon-data';

export type { IconName };

/** Ports the design system's `Icon` — geometry straight from icon-data. */
export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={d.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d.body }}
    />
  );
}

const BOX_SIZES = {
  'w-3': 12,
  'w-4': 16,
  'w-5': 20,
  'w-6': 24,
  'w-8': 32,
} as const;

export type IconBoxSize = keyof typeof BOX_SIZES;

/** Ports the design system's `IconBox` — a currentColor-inheriting square. */
export function IconBox({
  name,
  size = 'w-4',
  style,
}: {
  name: IconName;
  size?: IconBoxSize;
  style?: CSSProperties;
}) {
  const px = BOX_SIZES[size] ?? 16;
  return (
    <span
      style={{
        display: 'inline-flex',
        width: px,
        height: px,
        flexShrink: 0,
        color: 'currentColor',
        ...style,
      }}
    >
      <Icon name={name} size={px} />
    </span>
  );
}
