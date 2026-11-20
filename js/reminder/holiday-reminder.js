/**
 * Logika reminder pembaruan data hari libur.
 *
 * Aturan: untuk setiap tahun target Y yang datanya belum tersedia, reminder
 * aktif mulai 1 Januari tahun Y-1 (WIB). Artinya pada tanggal hari ini T,
 * tahun target yang relevan adalah Y <= T.year + 1. Reminder ditampilkan
 * sekali per tahun target dan dicatat di localStorage dengan key
 * holiday_reminder_shown_<Y>.
 *
 * Fungsi-fungsi di sini murni (tanpa DOM) sehingga mudah diuji dengan
 * tanggal simulasi; tampilan dialog diinjeksikan lewat parameter showAlert.
 */

import { REMINDER_KEY_PREFIX } from '../config.js';

export const reminderKey = (year) => `${REMINDER_KEY_PREFIX}${year}`;

/** Tanggal mulai reminder untuk tahun target Y: 1 Januari Y-1. */
export const reminderStartDate = (targetYear) => ({ year: targetYear - 1, month: 1, day: 1 });

export function buildReminderMessage(year) {
  return `Data hari libur nasional dan cuti bersama tahun ${year} belum tersedia. Silakan lakukan pembaruan data kalender.`;
}

/**
 * Tahun-tahun target yang datanya belum tersedia dan sudah melewati tanggal
 * mulai reminder. Dimulai dari awal cakupan data (coverage.from).
 */
export function getDueReminderYears(today, repository) {
  const years = [];
  for (let y = repository.coverage.from; y <= today.year + 1; y++) {
    if (!repository.isYearAvailable(y)) years.push(y);
  }
  return years;
}

/** Tahun target yang harus ditampilkan sekarang (jatuh tempo dan belum pernah ditampilkan). */
export function getPendingReminderYears(today, repository, storage) {
  return getDueReminderYears(today, repository).filter((y) => storage.get(reminderKey(y)) === null);
}

/**
 * Menampilkan reminder yang tertunda secara berurutan.
 * Status dicatat setelah pengguna menutup dialog ("Mengerti"), sehingga
 * reminder yang belum sempat dibaca (mis. aplikasi ditutup paksa) tetap
 * muncul pada pembukaan berikutnya, dan tidak pernah muncul lagi setelahnya.
 * Key untuk tahun yang datanya kini sudah tersedia dibersihkan agar storage rapi.
 * @returns {Promise<number[]>} tahun-tahun yang ditampilkan
 */
export async function runHolidayReminder({ today, repository, storage, showAlert }) {
  for (let y = repository.coverage.from; y <= Math.max(repository.coverage.to, today.year) + 1; y++) {
    if (repository.isYearAvailable(y)) storage.remove(reminderKey(y));
  }
  const pending = getPendingReminderYears(today, repository, storage);
  for (const year of pending) {
    await showAlert({ year, message: buildReminderMessage(year) });
    storage.set(reminderKey(year), new Date().toISOString());
  }
  return pending;
}
