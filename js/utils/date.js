/**
 * Utilitas tanggal kalender (civil date) yang bebas zona waktu.
 *
 * Seluruh tanggal direpresentasikan sebagai objek polos { year, month, day }
 * (month 1–12). Aritmetika dilakukan dengan Date.UTC sehingga tidak pernah
 * terpengaruh zona waktu perangkat maupun pergantian DST. Satu-satunya titik
 * yang menyentuh zona waktu adalah getTodayInTimeZone(), yang mengambil tanggal
 * "hari ini" menurut Asia/Jakarta.
 */

import { APP_TIMEZONE, DAY_NAMES_ISO, MONTH_NAMES } from '../config.js';

const MS_PER_DAY = 86400000;

/** @typedef {{ year: number, month: number, day: number }} CivilDate */

function utcMs(year, month, day) {
  const d = new Date(Date.UTC(2000, 0, 1));
  d.setUTCFullYear(year, month - 1, day); // setUTCFullYear tidak memetakan tahun 0–99 ke 1900-an
  return d.getTime();
}

function fromUtcMs(ms) {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** @returns {CivilDate} */
export function createDate(year, month, day) {
  return { year, month, day };
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year, month) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Jumlah hari sejak epoch (1970-01-01) — berguna untuk perbandingan dan selisih. */
export function toDayNumber(date) {
  return Math.round(utcMs(date.year, date.month, date.day) / MS_PER_DAY);
}

export function addDays(date, days) {
  return fromUtcMs(utcMs(date.year, date.month, date.day) + days * MS_PER_DAY);
}

/** Menggeser { year, month } sebanyak delta bulan. */
export function addMonths({ year, month }, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

export function compareMonths(a, b) {
  return (a.year * 12 + a.month) - (b.year * 12 + b.month);
}

/** Nomor hari ISO 8601: 1 = Senin ... 7 = Minggu. */
export function isoDayOfWeek(date) {
  const jsDay = new Date(utcMs(date.year, date.month, date.day)).getUTCDay(); // 0 = Minggu
  return jsDay === 0 ? 7 : jsDay;
}

export function isSameDate(a, b) {
  return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}

const pad = (n, len = 2) => String(n).padStart(len, '0');

/** Format YYYY-MM-DD. */
export function toISODate(date) {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

/** Parse YYYY-MM-DD secara ketat. Mengembalikan null bila tidak valid. */
export function parseISODate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ''));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/**
 * Nomor minggu ISO 8601 beserta tahun ISO-nya.
 * Minggu ISO adalah minggu yang memuat hari Kamis; minggu 1 adalah minggu yang
 * memuat Kamis pertama tahun tersebut (setara: memuat tanggal 4 Januari).
 * @returns {{ week: number, year: number }}
 */
export function getISOWeek(date) {
  const thursday = addDays(date, 4 - isoDayOfWeek(date));
  const jan1 = { year: thursday.year, month: 1, day: 1 };
  const week = Math.floor((toDayNumber(thursday) - toDayNumber(jan1)) / 7) + 1;
  return { week, year: thursday.year };
}

/**
 * Tanggal "hari ini" menurut zona waktu tertentu (default Asia/Jakarta),
 * terlepas dari zona waktu perangkat.
 * @param {Date} [now]
 * @returns {CivilDate}
 */
export function getTodayInTimeZone(now = new Date(), timeZone = APP_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** "Jumat, 20 November 2026" */
export function formatLongDate(date) {
  return `${DAY_NAMES_ISO[isoDayOfWeek(date)]}, ${date.day} ${MONTH_NAMES[date.month - 1]} ${date.year}`;
}
