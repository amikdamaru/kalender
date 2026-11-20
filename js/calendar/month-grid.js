/**
 * Model grid kalender bulanan: selalu 6 minggu × 7 hari (42 sel), Senin–Minggu.
 * Murni data — tidak menyentuh DOM.
 */

import { addDays, getISOWeek, isoDayOfWeek, isSameDate, toISODate } from '../utils/date.js';

export const WEEKS_PER_GRID = 6;
export const DAYS_PER_WEEK = 7;

/**
 * Klasifikasi warna tanggal sesuai aturan prioritas:
 *   1. di luar bulan aktif → 'muted'
 *   2. Sabtu, Minggu, libur nasional, cuti bersama → 'red'
 *   3. Jumat → 'green'
 *   4. selainnya → 'normal'
 * Highlight "hari ini" ditangani terpisah (prioritas tertinggi) dan memakai
 * baseTone agar warnanya tetap mencerminkan jenis hari.
 */
export function getDayTone({ isoDow, inMonth, hasHoliday }) {
  const baseTone = hasHoliday || isoDow >= 6 ? 'red' : isoDow === 5 ? 'green' : 'normal';
  return { baseTone, tone: inMonth ? baseTone : 'muted' };
}

/**
 * @param {number} year
 * @param {number} month 1–12
 * @param {{ today?: import('../utils/date.js').CivilDate, getHolidays?: (iso: string) => Array }} [options]
 */
export function buildMonthGrid(year, month, { today = null, getHolidays = () => [] } = {}) {
  const first = { year, month, day: 1 };
  let cursor = addDays(first, 1 - isoDayOfWeek(first)); // Senin pada/sebelum tanggal 1

  const weeks = [];
  for (let w = 0; w < WEEKS_PER_GRID; w++) {
    const monday = cursor;
    const days = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const iso = toISODate(cursor);
      const holidays = getHolidays(iso);
      const inMonth = cursor.year === year && cursor.month === month;
      const isoDow = d + 1;
      days.push({
        date: cursor,
        iso,
        isoDow,
        inMonth,
        isToday: isSameDate(cursor, today),
        holidays,
        ...getDayTone({ isoDow, inMonth, hasHoliday: holidays.length > 0 }),
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push({ isoWeek: getISOWeek(monday), days });
  }
  return { year, month, weeks };
}
