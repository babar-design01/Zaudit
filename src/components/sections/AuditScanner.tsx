import { color, radius, t } from '@/design/tokens';

/**
 * The left of the running dialog: the page being audited, under a moving scan
 * line. The picture is the engine's own capture of that page, so until the browser
 * has reached the site there is only an empty frame and a line saying so.
 */
export function AuditScanner({ host, image, label, finished }: { host: string; image: string | null; label: string; finished: boolean }) {
  return (
    <div
      data-scanner
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 300, height: '100%', overflow: 'hidden', borderRadius: radius.sm, border: `1px solid ${color.border}`, background: color.bgSubtle }}
    >
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: color.surface, borderBottom: `1px solid ${color.border}` }}>
        <span aria-hidden="true" style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: color.borderStrong }} />
          ))}
        </span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', font: t(400, 12, 16), color: color.inkMuted }}>{host}</span>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL from the audit stream
          <img data-scan-image src={image} alt={`The first screen of ${host}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
            {['38%', '82%', '64%', '100%', '100%', '72%'].map((width, i) => (
              <span key={i} data-scan-bone style={{ display: 'block', width, height: i === 3 || i === 4 ? 44 : 12, borderRadius: radius.sm, background: color.border }} />
            ))}
          </div>
        )}

        {!finished && (
          <span aria-hidden="true" data-scan-line style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90, pointerEvents: 'none', background: `linear-gradient(to bottom, transparent, ${color.blueTint})` }}>
            <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: color.blue, boxShadow: `0 0 14px 1px ${color.blue}` }} />
          </span>
        )}

        <span style={{ position: 'absolute', left: 10, bottom: 10, maxWidth: 'calc(100% - 20px)', padding: '4px 10px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', borderRadius: radius.sm, background: color.action, color: color.onAction, font: t(500, 12, 18) }}>
          {label}
        </span>
      </div>
    </div>
  );
}
