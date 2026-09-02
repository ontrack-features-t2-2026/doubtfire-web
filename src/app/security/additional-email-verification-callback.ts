type ReplaceState = (data: unknown, unused: string, url?: string | URL | null) => void;

let pendingVerificationToken: string | null = null;

/**
 * Capture a verification bearer token before telemetry or Angular starts and
 * remove it from browser history. The fragment is never sent to the web server.
 */
export function captureAndScrubAdditionalEmailVerification(
  href: string = globalThis.location?.href,
  replaceState: ReplaceState = (data, unused, url) =>
    globalThis.history.replaceState(data, unused, url),
): boolean {
  if (!href) {
    return true;
  }

  const url = new URL(href);
  if (!url.pathname.endsWith('/verify_additional_email')) {
    return true;
  }

  const fragment = new URLSearchParams(url.hash.replace(/^#\??/, ''));
  const token = fragment.get('token');
  if (!token) {
    return true;
  }

  pendingVerificationToken = token;
  fragment.delete('token');
  url.hash = fragment.toString() ? `#${fragment.toString()}` : '';
  replaceState(globalThis.history?.state ?? null, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function consumeAdditionalEmailVerificationToken(): string | null {
  const token = pendingVerificationToken;
  pendingVerificationToken = null;
  return token;
}
