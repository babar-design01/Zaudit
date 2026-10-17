import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Guards for a server that fetches whatever address a stranger types into a box.
 *
 * The audit endpoint takes a URL from the public internet and asks the server to
 * request it. Without a guard that is a confused deputy: `169.254.169.254` is the
 * cloud metadata endpoint, `127.0.0.1` is whatever else this box is running, and
 * both resolve perfectly well from here. So the host is resolved first and the
 * address it lands on is checked before anything is fetched.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

/** Reserved IPv4 space: loopback, link-local, private, CGNAT, benchmark, multicast. */
function isPrivateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true; // 192.0.0/24 protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast and reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (v === '::' || v === '::1') return true;
  if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
  // ::ffff:127.0.0.1 and friends — an IPv4 address wearing an IPv6 coat.
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true; // not an address we can reason about — refuse it
}

/**
 * Normalise a typed address, then confirm it points somewhere on the public
 * internet. Throws `UnsafeUrlError` with a reason the interface can show.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
  } catch {
    throw new UnsafeUrlError('That does not look like a website address. Try example.com.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https addresses can be audited.');
  }
  if (!url.hostname.includes('.') || url.hostname.endsWith('.')) {
    throw new UnsafeUrlError('That does not look like a website address. Try example.com.');
  }
  // A port other than the web ports usually means something that is not a website.
  if (url.port && !['80', '443', '8080', '8443'].includes(url.port)) {
    throw new UnsafeUrlError('Only standard web ports can be audited.');
  }
  if (/\.(local|internal|localhost|test|invalid|example)$/i.test(url.hostname)) {
    throw new UnsafeUrlError('That address is not reachable from the public internet.');
  }

  // A hostname is only as safe as what it resolves to, so check the address itself.
  const literal = isIP(url.hostname.replace(/^\[|\]$/g, ''));
  const addresses = literal
    ? [url.hostname.replace(/^\[|\]$/g, '')]
    : await lookup(url.hostname, { all: true, verbatim: true })
        .then((rs) => rs.map((r) => r.address))
        .catch(() => {
          throw new UnsafeUrlError(
            'Could not find ' + url.hostname + '. Check the address and try again.',
          );
        });

  if (!addresses.length) {
    throw new UnsafeUrlError('Could not find ' + url.hostname + '. Check the address and try again.');
  }
  if (addresses.some(isPrivateAddress)) {
    throw new UnsafeUrlError('That address resolves to a private network and cannot be audited.');
  }

  return url;
}
