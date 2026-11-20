/**
 * Registrasi Service Worker + mekanisme pembaruan.
 *
 * - `updateViaCache: 'none'` memastikan sw.js selalu dicek ke jaringan
 *   (tidak tertahan HTTP cache GitHub Pages).
 * - Pembaruan juga dicek setiap kali aplikasi kembali dibuka.
 * - Saat versi baru aktif (controllerchange), halaman dimuat ulang sekali
 *   agar aset lama tidak terus dipakai.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return; // instalasi pertama: tidak perlu reload
    reloading = true;
    window.location.reload();
  });

  const register = () => navigator.serviceWorker
    .register('./sw.js', { scope: './', updateViaCache: 'none' })
    .then((registration) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    })
    .catch(() => { /* aplikasi tetap berjalan tanpa SW */ });

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
