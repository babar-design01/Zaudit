'use client';

import { useState } from 'react';
import { Button, Text } from '@/components/ui';
import { Stack } from '@/components/ui';

/**
 * Starts a Stripe Checkout session and hands the browser over to it.
 *
 * The amount is decided on the server from the pack id; this sends a name, not
 * a price, so nothing here can change what is charged.
 */
export function BuyButton({ pack, label }: { pack: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Stack gap={6}>
      <Button
        variant="primary"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch('/api/billing/checkout', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ pack }),
            });
            const data = (await res.json()) as { url?: string; error?: string };
            if (data.url) {
              window.location.assign(data.url);
              return;
            }
            setError(data.error ?? 'Checkout could not start.');
          } catch {
            setError('Checkout could not start. Try again in a moment.');
          }
          setBusy(false);
        }}
      >
        {busy ? 'Opening checkout…' : label}
      </Button>
      {error && (
        <Text variant="fine" tone="muted">
          {error}
        </Text>
      )}
    </Stack>
  );
}
