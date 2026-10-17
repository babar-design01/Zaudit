'use client';

/** Ports the design system's `Input` at the sizes the homepage uses. */
export function Input({
  placeholder,
  value,
  onChange,
  ariaLabel,
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      aria-label={ariaLabel ?? placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 36,
        boxSizing: 'border-box',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--input)',
        background: 'var(--bg)',
        color: 'var(--fg)',
        font: '400 14px/20px var(--font-sans)',
        outline: 'none',
      }}
    />
  );
}
