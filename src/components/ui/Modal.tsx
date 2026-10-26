'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Card } from './layout';
import { color, radius } from '@/design/tokens';

/**
 * A centred dialog over a blurred backdrop.
 *
 * The product this sits in audits pages for exactly the failures a careless
 * dialog introduces, so this one closes on Escape, moves focus in on open and
 * returns it on close, keeps Tab inside itself while open, locks the page
 * behind it, and names itself to assistive tech.
 */
export function Modal({
  open,
  onClose,
  title,
  /** Set false while work is in flight that a stray click should not cancel. */
  dismissOnBackdrop = true,
  width = 540,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Announced as the dialog's name. Rendered by the caller, not by `Modal`. */
  title: string;
  dismissOnBackdrop?: boolean;
  width?: number;
  children: ReactNode;
}) {
  const labelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // Remember what had focus, move it into the dialog, and give it back on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => restoreFocusTo.current?.focus?.();
  }, [open]);

  // Hold the page still behind the dialog, without letting the scrollbar's
  // disappearance shift the layout underneath it.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gutter = window.innerWidth - documentElement.clientWidth;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    return () => {
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
    };
  }, [open]);

  // Escape closes; Tab cycles within the dialog rather than escaping to the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        // The glow field, veiled at 28%: the backdrop every Audix dialog sits on.
        background: color.bgMist,
        overflow: 'hidden',
        animation: 'ax-backdrop-in 180ms ease both',
      }}
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the backdrop closes it, so a
        // drag that happens to finish outside the panel does not.
        if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <span data-blob="a" style={{ position: 'absolute', left: '-20%', top: '-30%', width: '70%', height: '90%', borderRadius: '50%', background: color.glowCyan, filter: 'blur(80px)', opacity: 0.9 }} />
        <span data-blob="b" style={{ position: 'absolute', right: '-20%', top: '10%', width: '60%', height: '90%', borderRadius: '50%', background: color.glowBlue, filter: 'blur(90px)', opacity: 0.8 }} />
        <span data-blob="c" style={{ position: 'absolute', left: '20%', bottom: '-40%', width: '70%', height: '70%', borderRadius: '50%', background: color.glowWhite, filter: 'blur(80px)', opacity: 0.95 }} />
        <span style={{ position: 'absolute', inset: 0, background: 'rgba(10, 11, 13, 0.28)' }} />
      </div>
      <Card
        as="div"
        elevation="float"
        radius={radius.lg}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        ref={panel}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          position: 'relative',
          background: color.surface,
          boxShadow: 'var(--shadow-float)',
          animation: 'ax-dialog-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
          outline: 'none',
        }}
      >
        <span id={labelId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {children}
      </Card>
    </div>
  );
}
