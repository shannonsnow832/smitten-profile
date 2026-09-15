/*
 * Service worker registration.
 *
 * Deliberately a no-op in dev: Vite serves modules unbundled and a worker
 * holding on to them makes for very confusing hot reloads.
 */

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // When a new worker finishes installing alongside an existing one, take
        // over straight away rather than waiting for every tab to close. The
        // app holds no unsaved state a swap could lose: the profile form
        // autosaves, and the auth session lives in Supabase storage.
        registration.addEventListener('updatefound', () => {
          const incoming = registration.installing;
          if (!incoming) return;
          incoming.addEventListener('statechange', () => {
            if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
              incoming.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((error) => {
        // A failed registration must never take the app down with it.
        console.warn('Service worker registration failed', error);
      });
  });
}
