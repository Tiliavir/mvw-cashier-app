'use strict';

var Paths = (function () {
  const DEFAULT_BASE_URL = '/';

  function normalizeBaseUrl(value) {
    let base = String(value || '/').trim();
    if (!base) base = '/';
    if (!base.startsWith('/')) base = '/' + base;
    if (!base.endsWith('/')) base += '/';
    return base.replace(/\/+/g, '/');
  }

  function getBaseUrl() {
    const baseEl = document.querySelector('base');
    if (!baseEl) return DEFAULT_BASE_URL;
    const href = baseEl.getAttribute('href') || DEFAULT_BASE_URL;
    return normalizeBaseUrl(href);
  }

  function resolve(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    const base = getBaseUrl();
    return cleanPath ? base + cleanPath : base;
  }

  function page(pagePath, query) {
    const cleanPage = String(pagePath || '').replace(/^\/+|\/+$/g, '');
    let url = resolve(cleanPage ? cleanPage + '/' : '');

    if (query && typeof query === 'object') {
      const params = new URLSearchParams();
      Object.keys(query).forEach(function (key) {
        if (query[key] !== undefined && query[key] !== null) {
          params.set(key, String(query[key]));
        }
      });
      const qs = params.toString();
      if (qs) url += '?' + qs;
    }

    return url;
  }

  return {
    normalizeBaseUrl: normalizeBaseUrl,
    getBaseUrl: getBaseUrl,
    resolve: resolve,
    page: page,
  };
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Paths;
}