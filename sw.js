/**
 * Service Worker Kalender.
 *
 * Strategi:
 * - Seluruh aset aplikasi (termasuk data hari libur) di-precache saat install,
 *   sehingga kalender tetap berfungsi tanpa koneksi.
 * - Request dilayani cache-first dari cache versi aktif, fallback ke jaringan.
 * - SETIAP perubahan file aplikasi WAJIB disertai kenaikan CACHE_VERSION.
 *   Perubahan byte pada sw.js memicu install versi baru → cache baru dibuat,
 *   cache lama dihapus saat activate, dan halaman dimuat ulang otomatis
 *   (lihat js/pwa/register-sw.js).
 */

const CACHE_VERSION = '1.0.0';
const CACHE_PREFIX = 'kalender-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/main.js',
  './js/config.js',
  './js/utils/date.js',
  './js/utils/storage.js',
  './js/calendar/month-grid.js',
  './js/holidays/holiday-repository.js',
  './js/reminder/holiday-reminder.js',
  './js/ui/calendar-view.js',
  './js/ui/month-pager.js',
  './js/ui/month-picker.js',
  './js/ui/alert.js',
  './js/pwa/register-sw.js',
  './data/holidays.json',
  './vendor/sweetalert2/sweetalert2.min.js',
  './vendor/sweetalert2/sweetalert2.min.css',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' melewati HTTP cache agar yang disimpan benar-benar versi terbaru
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Aset aplikasi → dari cache versi aktif (query string diabaikan, mis. ?today=...).
  // Selain itu (mis. tests/) → jaringan, tanpa disimpan ke cache.
  // Navigasi yang gagal karena offline → fallback ke halaman aplikasi.
  event.respondWith(
    caches.match(request, { cacheName: CACHE_NAME, ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch((error) => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html', { cacheName: CACHE_NAME }).then((page) => page || Promise.reject(error));
        }
        throw error;
      });
    }),
  );
});
