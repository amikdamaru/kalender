/**
 * Merender model grid bulan (month-grid.js) menjadi elemen DOM.
 */

import { DAY_NAMES_ISO, MONTH_NAMES } from '../config.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Teks label yang ditampilkan di bawah angka tanggal. */
export function holidayLabelText(holiday) {
  return holiday.category === 'collective_leave' ? `Cuti Bersama ${holiday.name}` : holiday.name;
}

function describeDay(day) {
  const { date } = day;
  const parts = [`${DAY_NAMES_ISO[day.isoDow]}, ${date.day} ${MONTH_NAMES[date.month - 1]} ${date.year}`];
  if (day.isToday) parts.push('hari ini');
  day.holidays.forEach((h) => parts.push(holidayLabelText(h)));
  return parts.join('. ');
}

function createDayCell(day) {
  const cell = el('div', `day tone-${day.tone} base-${day.baseTone}`);
  cell.setAttribute('role', 'gridcell');
  cell.setAttribute('aria-label', describeDay(day));
  if (!day.inMonth) cell.classList.add('is-outside');
  if (day.isToday) {
    cell.classList.add('is-today');
    cell.setAttribute('aria-current', 'date');
  }

  const number = el('span', 'day-number', String(day.date.day));
  number.setAttribute('aria-hidden', 'true');
  cell.append(number);

  if (day.holidays.length) {
    cell.classList.add('has-holiday');
    number.append(el('span', 'holiday-dot'));
    const labels = el('div', 'holiday-labels');
    labels.setAttribute('aria-hidden', 'true');
    day.holidays.forEach((h) => labels.append(el('span', 'holiday-label', holidayLabelText(h))));
    cell.append(labels);
  }
  return cell;
}

/** @param {ReturnType<import('../calendar/month-grid.js').buildMonthGrid>} grid */
export function createMonthElement(grid) {
  const root = el('div', 'month');
  root.setAttribute('role', 'grid');
  root.setAttribute('aria-label', `${MONTH_NAMES[grid.month - 1]} ${grid.year}`);

  for (const week of grid.weeks) {
    const row = el('div', 'week');
    row.setAttribute('role', 'row');
    const weekNo = el('div', 'week-number', String(week.isoWeek.week));
    weekNo.setAttribute('role', 'rowheader');
    weekNo.setAttribute('aria-label', `Minggu ke-${week.isoWeek.week}`);
    row.append(weekNo, ...week.days.map(createDayCell));
    root.append(row);
  }
  return root;
}

/**
 * Mengecilkan ukuran teks label hari libur secara bertahap hingga muat di
 * dalam sel, agar nama panjang/ganda tidak merusak tinggi grid.
 * Harus dipanggil setelah elemen berada di DOM (butuh pengukuran layout).
 */
const MIN_LABEL_SCALE = 0.7;
const SCALE_STEP = 0.06;

export function fitHolidayLabels(root) {
  const cells = root.querySelectorAll('.day.has-holiday');
  cells.forEach((cell) => {
    cell.style.removeProperty('--label-scale');
    cell.classList.remove('is-tight');
  });
  cells.forEach((cell) => {
    const box = cell.querySelector('.holiday-labels');
    const overflows = () => box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1;
    let scale = 1;
    while (overflows() && scale > MIN_LABEL_SCALE) {
      scale = Math.max(MIN_LABEL_SCALE, +(scale - SCALE_STEP).toFixed(2));
      cell.style.setProperty('--label-scale', String(scale));
    }
    if (overflows()) cell.classList.add('is-tight'); // izinkan pemenggalan kata sebagai upaya terakhir
  });
}
