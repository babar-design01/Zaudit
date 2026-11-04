/**
 * Checks a Cloudflare Turnstile token with Cloudflare. The widget in the browser
 * proves nothing by itself, because anyone can post to the route directly.
 *
 * With no secret configured there is no captcha to check, so the form runs on its
 * rate limit alone, as it did before. If Cloudflare cannot be reached the message
 * is refused: an outage should not be a way past the check.
 */
export async function verifyCaptcha(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8_000),
    });
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch (err) {
    console.warn('captcha: could not reach Cloudflare —', err instanceof Error ? err.message : err);
    return false;
  }
}
