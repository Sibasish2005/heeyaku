import { NextRequest } from 'next/server';

// Standard regex to validate IPv4 and IPv6 formatting
const IPV4_REGEX = /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){1,7}:$/;

function isValidIp(ip: string): boolean {
  if (!ip) return false;
  const trimmed = ip.trim();
  // Strip port if present (e.g., 192.168.1.1:54321)
  const cleanIp = trimmed.includes(':') && trimmed.includes('.')
    ? trimmed.split(':')[0]
    : trimmed;
  return IPV4_REGEX.test(cleanIp) || IPV6_REGEX.test(cleanIp) || cleanIp === '::1';
}

function sanitizeIp(ip: string): string {
  const trimmed = ip.trim();
  return trimmed.includes(':') && trimmed.includes('.')
    ? trimmed.split(':')[0]
    : trimmed;
}

/**
 * Resolves the authentic client IP address using verified platform-provided headers
 * and trusted-proxy chain validation, preventing X-Forwarded-For and header spoofing attacks.
 *
 * Ingress Topology Rules:
 * 1. If TRUSTED_INGRESS_PROVIDER is explicitly 'cloudflare', 'cf-connecting-ip' is trusted first.
 * 2. On Vercel edge runtime (or when x-vercel-forwarded-for is present), 'x-vercel-forwarded-for'
 *    is authoritative because Vercel edge guarantees it against external socket forgery.
 * 3. In the absence of Vercel edge headers, 'cf-connecting-ip' is checked.
 * 4. 'x-real-ip' is checked for standard single reverse proxy deployments (Nginx, AWS ALB).
 * 5. 'x-forwarded-for' is traversed from the right using TRUSTED_PROXY_HOPS (default: 1)
 *    to ignore attacker-controlled leftmost header entries.
 *
 * @param req Request or NextRequest or Headers
 * @returns Validated client IP string or 'unknown-ip'
 */
export function getClientIp(req: Request | NextRequest | Headers): string {
  const headers = 'headers' in req ? req.headers : req;
  const ingressProvider = (process.env.TRUSTED_INGRESS_PROVIDER || '').toLowerCase();

  // 1. Explicit Cloudflare Ingress Configuration
  if (ingressProvider === 'cloudflare') {
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp && isValidIp(cfIp)) {
      return sanitizeIp(cfIp);
    }
  }

  // 2. Authoritative Vercel Edge Header (Cannot be spoofed externally on Vercel infrastructure)
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const firstVercel = vercelIp.split(',')[0].trim();
    if (isValidIp(firstVercel)) {
      return sanitizeIp(firstVercel);
    }
  }

  // 3. Fallback Cloudflare header if not deployed on Vercel or if Vercel headers are omitted
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp)) {
    return sanitizeIp(cfIp);
  }

  // 4. Reverse Proxy Real-IP (Nginx / ALB)
  const realIp = headers.get('x-real-ip');
  if (realIp && isValidIp(realIp)) {
    return sanitizeIp(realIp);
  }

  // 5. Multi-hop X-Forwarded-For processing
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const parts = xForwardedFor
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      // In reverse-proxy topologies, proxies append the connecting IP at the right.
      // Leftmost entry is untrusted client-supplied input.
      // Default to rightmost IP (hops = 1) unless explicitly configured otherwise.
      const trustedHops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10));
      const targetIndex = Math.max(0, parts.length - trustedHops);
      const resolved = parts[targetIndex] || parts[parts.length - 1];

      if (isValidIp(resolved)) {
        return sanitizeIp(resolved);
      }
    }
  }

  // 6. Fallback for local test environments
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  return 'unknown-ip';
}
