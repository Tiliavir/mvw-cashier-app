// ─── Service Worker Registration ──────────────────────────────────────────────
// Makes the app work offline once installed. Only included in production builds.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch((error: unknown) => {
    console.error('Service Worker konnte nicht registriert werden', error);
  });
}
