/**
 * Titik masuk aplikasi: merangkai data, logika, dan komponen UI.
 */

import { HOLIDAY_DATA_URL, MAX_YEAR, MIN_YEAR, MONTH_NAMES } from './config.js';
import { formatLongDate, getTodayInTimeZone, isSameDate, parseISODate } from './utils/date.js';
import { safeStorage } from './utils/storage.js';
import { buildMonthGrid } from './calendar/month-grid.js';
import { createHolidayRepository, loadHolidayRepository } from './holidays/holiday-repository.js';
import { runHolidayReminder } from './reminder/holiday-reminder.js';
import { createMonthElement, fitHolidayLabels } from './ui/calendar-view.js';
import { createMonthPager } from './ui/month-pager.js';
import { createMonthPicker } from './ui/month-picker.js';
import { showReminderAlert } from './ui/alert.js';
import { registerServiceWorker } from './pwa/register-sw.js';

const els = {
  todayLabel: document.getElementById('today-label'),
  monthButton: document.getElementById('month-button'),
  monthName: document.getElementById('month-name'),
  monthYear: document.getElementById('month-year'),
  viewport: document.getElementById('calendar-viewport'),
  picker: document.getElementById('month-picker'),
};

/**
 * Tanggal hari ini (WIB). Untuk pengujian manual, tanggal dapat disimulasikan
 * dengan parameter URL ?today=YYYY-MM-DD (lihat HOLIDAY_DATA.md).
 */
function resolveToday() {
  const override = parseISODate(new URLSearchParams(window.location.search).get('today'));
  return override ?? getTodayInTimeZone();
}

const EMPTY_DATA = { coverage: { from: 0, to: 0 }, years: {}, holidays: [], sources: {} };

async function init() {
  let today = resolveToday();
  let repository = createHolidayRepository(EMPTY_DATA);
  let dataLoaded = false;
  try {
    repository = await loadHolidayRepository(HOLIDAY_DATA_URL);
    dataLoaded = true;
  } catch (err) {
    console.warn('[Kalender] Data hari libur tidak dapat dimuat:', err);
  }

  const renderTodayLabel = () => { els.todayLabel.textContent = formatLongDate(today); };

  const pager = createMonthPager({
    viewport: els.viewport,
    renderMonth: ({ year, month }) =>
      createMonthElement(buildMonthGrid(year, month, { today, getHolidays: repository.getHolidays })),
    afterMount: fitHolidayLabels,
    canNavigate: ({ year }) => year >= MIN_YEAR && year <= MAX_YEAR,
    onMonthChange: ({ year, month }) => {
      els.monthName.textContent = MONTH_NAMES[month - 1];
      els.monthYear.textContent = String(year);
      els.monthButton.setAttribute('aria-label', `${MONTH_NAMES[month - 1]} ${year}. Ketuk untuk memilih bulan dan tahun`);
    },
  });

  const picker = createMonthPicker({
    dialog: els.picker,
    onSelect: (ym) => pager.show(ym),
  });
  els.monthButton.addEventListener('click', () => picker.open(pager.current, today));

  renderTodayLabel();
  pager.show({ year: today.year, month: today.month });
  document.documentElement.classList.add('is-ready');

  let reminderRunning = false;
  const checkReminder = async () => {
    if (!dataLoaded || reminderRunning) return; // tanpa data, jangan memicu reminder palsu
    reminderRunning = true;
    try {
      await runHolidayReminder({ today, repository, storage: safeStorage, showAlert: showReminderAlert });
    } catch (err) {
      console.warn('[Kalender] Reminder tidak dapat ditampilkan:', err);
    } finally {
      reminderRunning = false;
    }
  };
  checkReminder();

  // Saat aplikasi dibuka kembali: perbarui "hari ini". Jika tanggal sudah
  // berganti, kembali ke bulan berjalan dan periksa ulang reminder.
  const onResume = () => {
    if (document.visibilityState !== 'visible') return;
    const latest = resolveToday();
    if (isSameDate(latest, today)) return;
    today = latest;
    renderTodayLabel();
    picker.close();
    pager.show({ year: today.year, month: today.month }, { animate: false });
    checkReminder();
  };
  document.addEventListener('visibilitychange', onResume);
  window.addEventListener('pageshow', (e) => { if (e.persisted) onResume(); });

  // Ukuran layar berubah (rotasi, keyboard, dsb.) → hitung ulang ukuran label.
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => pager.element && fitHolidayLabels(pager.element));
  });
}

init();
registerServiceWorker();
