/**
 * The Zaudit design system.
 *
 * One import for everything the page is built from:
 *
 *   import { Section, Container, Stack, Card, Heading, Text } from '@/components/ui';
 *
 * The values behind these live in `@/design/tokens`. Import those directly when
 * you need a raw token — a colour for a computed style, a step from the ramp —
 * rather than retyping a literal.
 *
 * `/design` renders every token and component on one page.
 */

/* Layout and surfaces */
export { Section, Container, Stack, Row, Grid, Spacer, Divider, Card } from './layout';
export type { SectionTone, CardTone, StackProps, Gap } from './layout';

/* Typography */
export { Text, Heading, Eyebrow, GradientText, SectionHeader } from './typography';
export type { TextTone, MeasureName } from './typography';

/* Elements */
export { ArrowLink, IconTile, Dot, CountPill, Meter, MetaRow, FieldLabel } from './elements';

/* Controls */
export { Button, ButtonLink } from './Button';
export type { ButtonProps } from './Button';
export { Badge } from './Badge';
export { Input } from './Input';

/* Media and glyphs */
export { Icon, IconBox } from './Icon';
export { Modal } from './Modal';
export { ShimmerText, RotatingLines } from './ShimmerText';
export { SeverityTag, SEVERITY_COLORS, SEVERITY_DOTS } from './SeverityTag';
export type { IconName, IconBoxSize } from './Icon';
export { MaterialSymbol } from './primitives';
export { ImageSlot } from './ImageSlot';
