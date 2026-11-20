/**
 * Akses data hari libur nasional & cuti bersama (data/holidays.json).
 * Tidak bergantung pada DOM; dapat diuji terpisah.
 */

import { parseISODate } from '../utils/date.js';

export const HOLIDAY_CATEGORIES = Object.freeze(['national_holiday', 'collective_leave']);
export const YEAR_STATUS_AVAILABLE = 'available';

/** Memuat dan membangun repository dari file JSON statis. */
export async function loadHolidayRepository(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal memuat data hari libur (${response.status})`);
  return createHolidayRepository(await response.json());
}

export function createHolidayRepository(data) {
  const byDate = new Map();
  for (const holiday of data.holidays ?? []) {
    if (!byDate.has(holiday.date)) byDate.set(holiday.date, []);
    byDate.get(holiday.date).push(Object.freeze({ ...holiday }));
  }
  const years = data.years ?? {};

  return Object.freeze({
    coverage: Object.freeze({ ...data.coverage }),
    /** Seluruh entri pada tanggal ISO tertentu (bisa lebih dari satu). */
    getHolidays: (isoDate) => byDate.get(isoDate) ?? [],
    /** True bila data resmi tahun tersebut sudah tersedia di aplikasi. */
    isYearAvailable: (year) => years[year]?.status === YEAR_STATUS_AVAILABLE,
    getYearInfo: (year) => years[year] ?? null,
    getSource: (id) => data.sources?.[id] ?? null,
  });
}

/**
 * Pemeriksaan integritas data. Mengembalikan daftar pesan galat (kosong = valid).
 * Dipakai oleh pengujian otomatis (tests/) dan saat memperbarui data.
 */
export function validateHolidayData(data) {
  const errors = [];
  const sources = data.sources ?? {};
  const years = data.years ?? {};
  const seen = new Set();

  if (!data.coverage || !(data.coverage.from <= data.coverage.to)) errors.push('coverage tidak valid');

  for (const [year, info] of Object.entries(years)) {
    if (![YEAR_STATUS_AVAILABLE, 'not_available'].includes(info.status)) {
      errors.push(`years.${year}: status tidak dikenal "${info.status}"`);
    }
    if (info.status === YEAR_STATUS_AVAILABLE && !sources[info.source]) {
      errors.push(`years.${year}: sumber "${info.source}" tidak ditemukan`);
    }
  }

  (data.holidays ?? []).forEach((h, i) => {
    const where = `holidays[${i}] (${h.date})`;
    const date = parseISODate(h.date);
    if (!date) errors.push(`${where}: tanggal tidak valid`);
    else if (date.year !== h.year) errors.push(`${where}: field year tidak cocok dengan tanggal`);
    if (!h.name || typeof h.name !== 'string') errors.push(`${where}: nama kosong`);
    if (!HOLIDAY_CATEGORIES.includes(h.category)) errors.push(`${where}: kategori tidak valid`);
    if (!sources[h.source]) errors.push(`${where}: sumber "${h.source}" tidak ditemukan`);
    if (years[h.year]?.status !== YEAR_STATUS_AVAILABLE) {
      errors.push(`${where}: tahun ${h.year} belum ditandai "available"`);
    }
    const key = `${h.date}|${h.category}|${h.name}`;
    if (seen.has(key)) errors.push(`${where}: entri duplikat`);
    seen.add(key);
  });

  for (const [year, info] of Object.entries(years)) {
    const count = (data.holidays ?? []).filter((h) => h.year === Number(year)).length;
    if (info.status === YEAR_STATUS_AVAILABLE && count === 0) errors.push(`years.${year}: available tetapi tanpa data`);
    if (info.status !== YEAR_STATUS_AVAILABLE && count > 0) errors.push(`years.${year}: belum available tetapi memiliki data`);
  }
  return errors;
}
