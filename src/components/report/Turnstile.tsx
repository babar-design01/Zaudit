'use client';

import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** The key the widget runs on. Without one there is no captcha to show. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('The captcha could not load.'));
    document.head.append(script);
  });
  return loading;
}

/**
 * Cloudflare's captcha. It hands back a token, which only counts once the server
 * has checked it with Cloudflare: see `verifyCaptcha`.
 *
 * Changing `resetKey` asks for a fresh token, because each one works only once.
 */
export function Turnstile({ onToken, onFail, resetKey }: { onToken: (token: string | null) => void; onFail: () => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // Held in refs so a parent re-render does not tear the widget down.
  const handlers = useRef({ onToken, onFail });
  handlers.current = { onToken, onFail };

  useEffect(() => {
    let gone = false;
    loadScript()
      .then(() => {
        if (gone || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          size: 'flexible',
          callback: (token: string) => handlers.current.onToken(token),
          'expired-callback': () => handlers.current.onToken(null),
          'error-callback': () => handlers.current.onFail(),
        });
      })
      .catch(() => handlers.current.onFail());
    return () => {
      gone = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return <div ref={box} style={{ gridColumn: '1 / -1', minHeight: 65 }} />;
}
