const DEFAULT_BASE_URL = '/';

function normalizeBaseUrl(value: string | null): string {
  let base = String(value || '/').trim();
  if (!base) base = '/';
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  return base.replace(/\/+/g, '/');
}

function getBaseUrl(): string {
  const baseEl = document.querySelector('base');
  if (!baseEl) return DEFAULT_BASE_URL;

  let href = baseEl.getAttribute('href') || DEFAULT_BASE_URL;

  // Normalize scheme-less URLs (e.g., //localhost:1313/)
  if (href.startsWith('//')) {
    href = window.location.protocol + ':' + href;
  }

  // If base href is absolute and doesn't match current origin, use root
  if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
    try {
      const baseUrl = new URL(href);
      const currentUrl = new URL(window.location.href);
      if (baseUrl.origin !== currentUrl.origin) {
        // Mismatch: static files built with different baseURL, use root
        href = '/';
      }
    } catch (_e) {
      href = '/';
    }
  }

  return normalizeBaseUrl(href || DEFAULT_BASE_URL);
}

function resolve(path: string): string {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const base = getBaseUrl();
  return cleanPath ? base + cleanPath : base;
}

function page(pagePath: string, query?: Record<string, string | number>): string {
  // Always return root-relative paths (beginning with /)
  const cleanPage = String(pagePath || '').replace(/^\/+|\/+$/g, '');
  const url = cleanPage ? '/' + cleanPage + '/' : '/';

  if (query && typeof query === 'object') {
    const params = new URLSearchParams();
    Object.keys(query).forEach((key) => {
      const val = query[key];
      if (val !== undefined && val !== null) {
        params.set(key, String(val));
      }
    });
    const qs = params.toString();
    if (qs) return url + '?' + qs;
  }

  return url;
}

export const Paths = {
  normalizeBaseUrl,
  getBaseUrl,
  resolve,
  page,
};
