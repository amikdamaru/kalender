/**
 * Konfigurasi global aplikasi. Tidak berisi logika.
 */

/** Zona waktu acuan seluruh perhitungan "hari ini" (WIB). */
export const APP_TIMEZONE = 'Asia/Jakarta';

/** Lokasi data hari libur, relatif terhadap index.html (aman untuk subpath GitHub Pages). */
export const HOLIDAY_DATA_URL = 'data/holidays.json';

/** Prefix key localStorage untuk status reminder per tahun target, mis. holiday_reminder_shown_2028. */
export const REMINDER_KEY_PREFIX = 'holiday_reminder_shown_';

/** Rentang tahun yang dapat dipilih pada pemilih bulan/tahun. */
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Nama hari berdasarkan nomor hari ISO (1 = Senin ... 7 = Minggu); indeks 0 tidak dipakai. */
export const DAY_NAMES_ISO = [null, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
