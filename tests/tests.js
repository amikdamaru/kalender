/**
 * Pengujian otomatis untuk logika tanggal, grid, data hari libur, dan reminder.
 * Buka tests/index.html melalui server lokal (lihat README.md).
 */

import {
  addDays, addMonths, daysInMonth, formatLongDate, getISOWeek, getTodayInTimeZone,
  isLeapYear, isoDayOfWeek, parseISODate, toISODate,
} from '../js/utils/date.js';
import { buildMonthGrid } from '../js/calendar/month-grid.js';
import { createHolidayRepository, validateHolidayData } from '../js/holidays/holiday-repository.js';
import {
  buildReminderMessage, getDueReminderYears, reminderKey, runHolidayReminder,
} from '../js/reminder/holiday-reminder.js';

const results = [];
const test = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); } catch (err) { results.push({ name, ok: false, err }); }
};
const assert = (cond, msg = 'assertion failed') => { if (!cond) throw new Error(msg); };
const eq = (actual, expected, msg = '') => {
  const a = JSON.stringify(actual); const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} diharapkan ${e}, didapat ${a}`);
};
const d = (iso) => parseISODate(iso);

function memoryStorage() {
  const map = new Map();
  return {
    map,
    get: (k) => (map.has(k) ? map.get(k) : null),
    set: (k, v) => { map.set(k, String(v)); return true; },
    remove: (k) => { map.delete(k); },
  };
}

const data = await (await fetch('../data/holidays.json', { cache: 'no-store' })).json();
const repo = createHolidayRepository(data);

// ---------------------------------------------------------------- Tanggal
await test('Tahun kabisat', () => {
  eq([2020, 2024, 2000, 2028].map(isLeapYear), [true, true, true, true]);
  eq([2021, 2023, 1900, 2100].map(isLeapYear), [false, false, false, false]);
});

await test('Jumlah hari per bulan (Februari kabisat & non-kabisat)', () => {
  eq(daysInMonth(2024, 2), 29, 'Feb 2024');
  eq(daysInMonth(2023, 2), 28, 'Feb 2023');
  eq(daysInMonth(2100, 2), 28, 'Feb 2100');
  eq(daysInMonth(2000, 2), 29, 'Feb 2000');
  eq([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => daysInMonth(2026, m)), [31, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
});

await test('Pergeseran bulan & pergantian tahun', () => {
  eq(addMonths({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 });
  eq(addMonths({ year: 2027, month: 1 }, -1), { year: 2026, month: 12 });
  eq(addMonths({ year: 2026, month: 11 }, -23), { year: 2024, month: 12 });
  eq(toISODate(addDays(d('2026-12-31'), 1)), '2027-01-01');
  eq(toISODate(addDays(d('2024-03-01'), -1)), '2024-02-29');
  eq(toISODate(addDays(d('2023-03-01'), -1)), '2023-02-28');
});

await test('Hari dalam minggu (ISO, Senin = 1)', () => {
  eq(isoDayOfWeek(d('2026-11-20')), 5, '20 Nov 2026 Jumat');
  eq(isoDayOfWeek(d('2024-09-01')), 7, '1 Sep 2024 Minggu');
  eq(isoDayOfWeek(d('2021-02-01')), 1, '1 Feb 2021 Senin');
});

await test('Parse tanggal ISO ketat', () => {
  eq(parseISODate('2024-02-29'), { year: 2024, month: 2, day: 29 });
  eq(parseISODate('2023-02-29'), null);
  eq(parseISODate('2026-13-01'), null);
  eq(parseISODate('20-11-2026'), null);
  eq(parseISODate(null), null);
});

await test('Format tanggal hari ini', () => {
  eq(formatLongDate(d('2026-11-20')), 'Jumat, 20 November 2026');
  eq(formatLongDate(d('2027-01-03')), 'Minggu, 3 Januari 2027');
});

await test('Hari ini mengikuti WIB, bukan UTC/zona perangkat', () => {
  eq(getTodayInTimeZone(new Date('2026-11-19T17:30:00Z')), { year: 2026, month: 11, day: 20 }, '00:30 WIB');
  eq(getTodayInTimeZone(new Date('2026-11-20T16:59:59Z')), { year: 2026, month: 11, day: 20 }, '23:59 WIB');
  eq(getTodayInTimeZone(new Date('2026-11-20T17:00:00Z')), { year: 2026, month: 11, day: 21 }, '00:00 WIB');
  eq(getTodayInTimeZone(new Date('2026-12-31T17:00:00Z')), { year: 2027, month: 1, day: 1 }, 'tahun baru WIB');
});

// ---------------------------------------------------------------- ISO week
await test('ISO week: kasus batas tahun', () => {
  const cases = {
    '2020-12-31': [53, 2020], '2021-01-03': [53, 2020], '2021-01-04': [1, 2021],
    '2024-12-30': [1, 2025], '2025-01-01': [1, 2025], '2025-12-29': [1, 2026],
    '2026-11-20': [47, 2026], '2026-12-28': [53, 2026], '2026-12-31': [53, 2026],
    '2027-01-01': [53, 2026], '2027-01-03': [53, 2026], '2027-01-04': [1, 2027],
    '2005-01-01': [53, 2004], '2007-01-01': [1, 2007], '2008-12-29': [1, 2009],
    '2010-01-03': [53, 2009], '2015-12-31': [53, 2015], '2016-01-03': [53, 2015],
  };
  for (const [iso, [week, year]] of Object.entries(cases)) eq(getISOWeek(d(iso)), { week, year }, iso);
});

await test('ISO week: verifikasi silang setiap hari 1950–2100 (metode 4 Januari)', () => {
  // Metode alternatif: minggu 1 dimulai pada Senin dari minggu yang memuat 4 Januari.
  const week1Monday = (y) => { const jan4 = { year: y, month: 1, day: 4 }; return addDays(jan4, 1 - isoDayOfWeek(jan4)); };
  const dayNo = (x) => Date.UTC(x.year, x.month - 1, x.day) / 86400000;
  let date = { year: 1950, month: 1, day: 1 };
  while (date.year <= 2100) {
    let y = date.year + 1;
    while (dayNo(week1Monday(y)) > dayNo(date)) y--;
    const expected = { week: Math.floor((dayNo(date) - dayNo(week1Monday(y))) / 7) + 1, year: y };
    const actual = getISOWeek(date);
    if (actual.week !== expected.week || actual.year !== expected.year) {
      throw new Error(`${toISODate(date)}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`);
    }
    date = addDays(date, 1);
  }
});

// ---------------------------------------------------------------- Grid
await test('Grid selalu 6×7, mulai Senin, berurutan (setiap bulan 1900–2100)', () => {
  for (let year = 1900; year <= 2100; year++) {
    for (let month = 1; month <= 12; month++) {
      const grid = buildMonthGrid(year, month);
      const days = grid.weeks.flatMap((w) => w.days);
      assert(grid.weeks.length === 6 && days.length === 42, `${year}-${month}: ukuran grid`);
      assert(isoDayOfWeek(days[0].date) === 1, `${year}-${month}: tidak mulai Senin`);
      days.forEach((day, i) => {
        if (i > 0) assert(toISODate(addDays(days[i - 1].date, 1)) === day.iso, `${year}-${month}: tidak berurutan`);
        assert(day.isoDow === isoDayOfWeek(day.date), `${year}-${month}: isoDow salah`);
      });
      assert(days.filter((x) => x.inMonth).length === daysInMonth(year, month), `${year}-${month}: jumlah hari`);
      assert(grid.weeks[0].days.some((x) => x.inMonth && x.date.day === 1), `${year}-${month}: tanggal 1 tidak di baris pertama`);
      grid.weeks.forEach((w) => eq(w.isoWeek, getISOWeek(w.days[0].date), `${year}-${month}: nomor minggu`));
    }
  }
});

await test('Februari 2024 (kabisat) dan Februari 2023', () => {
  const feb24 = buildMonthGrid(2024, 2).weeks.flatMap((w) => w.days);
  eq(feb24.filter((x) => x.inMonth).length, 29);
  eq(feb24[0].iso, '2024-01-29');
  const feb23 = buildMonthGrid(2023, 2).weeks.flatMap((w) => w.days);
  eq(feb23.filter((x) => x.inMonth).length, 28);
  eq(feb23[0].iso, '2023-01-30');
});

await test('Bulan dimulai hari Minggu (September 2024, Maret 2026)', () => {
  const sep = buildMonthGrid(2024, 9).weeks;
  eq(sep[0].days[0].iso, '2024-08-26');
  eq(sep[0].days[6].iso, '2024-09-01');
  assert(sep[0].days.slice(0, 6).every((x) => !x.inMonth), 'enam hari pertama dari Agustus');
  // Maret 2026: 1 Maret Minggu, 31 hari → membutuhkan 6 baris penuh
  const mar = buildMonthGrid(2026, 3).weeks;
  eq(mar[5].days[1].iso, '2026-03-31');
  assert(mar[5].days[1].inMonth, '31 Maret berada di baris ke-6');
});

await test('Bulan dimulai hari Senin (Februari 2021) tetap 6 baris', () => {
  const weeks = buildMonthGrid(2021, 2).weeks;
  eq(weeks[0].days[0].iso, '2021-02-01');
  eq(weeks[5].days[6].iso, '2021-03-14');
});

await test('Pergantian Desember → Januari & nomor minggu (Desember 2026)', () => {
  const weeks = buildMonthGrid(2026, 12).weeks;
  eq(weeks.map((w) => w.isoWeek.week), [49, 50, 51, 52, 53, 1]);
  eq(weeks[0].days[0].iso, '2026-11-30');
  eq(weeks[5].days[6].iso, '2027-01-10');
  assert(!weeks[5].days[0].inMonth && weeks[4].days[3].inMonth, 'status bulan');
  eq(buildMonthGrid(2027, 1).weeks.map((w) => w.isoWeek.week), [53, 1, 2, 3, 4, 5]);
});

await test('Warna tanggal & prioritas', () => {
  const grid = buildMonthGrid(2026, 12, { today: d('2026-12-04'), getHolidays: repo.getHolidays });
  const byIso = Object.fromEntries(grid.weeks.flatMap((w) => w.days).map((x) => [x.iso, x]));
  eq(byIso['2026-12-01'].tone, 'normal', 'Selasa');
  eq(byIso['2026-12-04'].tone, 'green', 'Jumat');
  assert(byIso['2026-12-04'].isToday, 'hari ini ditandai');
  eq(byIso['2026-12-05'].tone, 'red', 'Sabtu');
  eq(byIso['2026-12-06'].tone, 'red', 'Minggu');
  eq(byIso['2026-12-24'].tone, 'red', 'Cuti bersama (Kamis)');
  eq(byIso['2026-12-25'].tone, 'red', 'Libur nasional pada Jumat → merah');
  eq(byIso['2026-11-30'].tone, 'muted', 'Luar bulan');
  eq(byIso['2027-01-01'].tone, 'muted', 'Libur di luar bulan → abu-abu');
  eq(byIso['2027-01-01'].baseTone, 'red');
  eq(byIso['2027-01-01'].holidays.length, 1, 'Nama libur di luar bulan tetap tersedia');
});

// ---------------------------------------------------------------- Data hari libur
await test('Data hari libur valid (skema, tanggal, kategori, sumber)', () => {
  const errors = validateHolidayData(data);
  assert(errors.length === 0, errors.join('\n'));
});

await test('Jumlah hari libur & cuti bersama per tahun sesuai SKB', () => {
  const expected = {
    2021: [16, 1], 2022: [16, 4], 2023: [16, 11], 2024: [17, 10],
    2025: [17, 11], 2026: [17, 8], 2027: [18, 8],
  };
  for (const [year, [nat, cuti]] of Object.entries(expected)) {
    const list = data.holidays.filter((h) => h.year === Number(year));
    eq(list.filter((h) => h.category === 'national_holiday').length, nat, `${year} libur nasional`);
    eq(list.filter((h) => h.category === 'collective_leave').length, cuti, `${year} cuti bersama`);
  }
});

await test('Tahun tanpa SKB resmi tidak berisi data karangan', () => {
  for (const y of [2028, 2029, 2030, 2031]) {
    assert(!repo.isYearAvailable(y), `${y} seharusnya belum tersedia`);
    eq(data.holidays.filter((h) => h.year === y).length, 0, `${y}`);
  }
  for (let y = 2021; y <= 2027; y++) assert(repo.isYearAvailable(y), `${y} seharusnya tersedia`);
});

await test('Satu tanggal dapat memiliki lebih dari satu hari libur', () => {
  eq(repo.getHolidays('2021-05-13').map((h) => h.name), ['Kenaikan Isa Almasih', 'Hari Raya Idul Fitri 1442 Hijriah']);
  eq(repo.getHolidays('2026-11-20'), []);
});

// ---------------------------------------------------------------- Reminder
await test('Pesan & key reminder', () => {
  eq(buildReminderMessage(2028), 'Data hari libur nasional dan cuti bersama tahun 2028 belum tersedia. Silakan lakukan pembaruan data kalender.');
  eq(reminderKey(2028), 'holiday_reminder_shown_2028');
});

await test('Tanggal pemicu reminder (simulasi tanggal)', () => {
  eq(getDueReminderYears(d('2026-11-20'), repo), [], '20 Nov 2026: data 2027 tersedia');
  eq(getDueReminderYears(d('2026-12-31'), repo), [], '31 Des 2026');
  eq(getDueReminderYears(d('2027-01-01'), repo), [2028], '1 Jan 2027');
  eq(getDueReminderYears(d('2027-01-15'), repo), [2028], '15 Jan 2027 (terlambat dibuka)');
  eq(getDueReminderYears(d('2028-01-01'), repo), [2028, 2029], '1 Jan 2028');
});

await test('Reminder hanya muncul sekali per tahun target', async () => {
  const storage = memoryStorage();
  const shown = [];
  const showAlert = async ({ year, message }) => { shown.push(year); assert(message.includes(String(year))); };

  eq(await runHolidayReminder({ today: d('2026-11-20'), repository: repo, storage, showAlert }), []);
  eq(await runHolidayReminder({ today: d('2027-01-15'), repository: repo, storage, showAlert }), [2028]);
  assert(storage.get('holiday_reminder_shown_2028') !== null, 'status 2028 tersimpan');
  eq(await runHolidayReminder({ today: d('2027-06-01'), repository: repo, storage, showAlert }), [], 'tidak berulang');
  eq(await runHolidayReminder({ today: d('2028-01-01'), repository: repo, storage, showAlert }), [2029], 'tahun berikutnya punya status sendiri');
  eq(shown, [2028, 2029]);
});

await test('Data yang sudah diperbarui tidak memicu reminder & status lama dibersihkan', async () => {
  const storage = memoryStorage();
  storage.set('holiday_reminder_shown_2028', 'x');
  const updated = structuredClone(data);
  updated.years['2028'] = { status: 'available', source: 'skb-2027' };
  updated.holidays.push({ date: '2028-01-01', name: 'Uji', category: 'national_holiday', year: 2028, source: 'skb-2027' });
  const updatedRepo = createHolidayRepository(updated);
  const shown = [];
  const result = await runHolidayReminder({
    today: d('2027-03-01'), repository: updatedRepo, storage, showAlert: async ({ year }) => shown.push(year),
  });
  eq(result, []);
  eq(shown, []);
  eq(storage.get('holiday_reminder_shown_2028'), null, 'key 2028 dibersihkan');
});

await test('Reminder gagal tampil tidak menandai status', async () => {
  const storage = memoryStorage();
  try {
    await runHolidayReminder({
      today: d('2027-01-01'), repository: repo, storage, showAlert: async () => { throw new Error('offline'); },
    });
  } catch { /* diharapkan */ }
  eq(storage.get('holiday_reminder_shown_2028'), null);
});

// ---------------------------------------------------------------- Laporan
const failed = results.filter((r) => !r.ok);
const summary = document.getElementById('summary');
summary.textContent = failed.length ? `GAGAL: ${failed.length} dari ${results.length} pengujian` : `LULUS: ${results.length} pengujian`;
summary.className = failed.length ? 'fail' : 'pass';
summary.dataset.status = failed.length ? 'fail' : 'pass';
const list = document.getElementById('results');
for (const r of results) {
  const li = document.createElement('li');
  li.className = r.ok ? 'pass' : 'fail';
  li.textContent = r.ok ? `✓ ${r.name}` : `✗ ${r.name}\n   ${r.err.message}`;
  list.append(li);
}
