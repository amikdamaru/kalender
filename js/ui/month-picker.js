/**
 * Pemilih bulan & tahun berupa bottom sheet (<dialog>).
 * - Grid 12 bulan untuk tahun yang sedang dipilih.
 * - Tahun dapat digeser per satu tahun, atau dipilih langsung dari daftar tahun.
 */

import { MAX_YEAR, MIN_YEAR, MONTH_NAMES } from '../config.js';

const CHEVRON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const CHEVRON_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

/**
 * @param {{ dialog: HTMLDialogElement, onSelect: (ym: {year:number, month:number}) => void }} options
 */
export function createMonthPicker({ dialog, onSelect }) {
  dialog.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle" aria-hidden="true"></div>
      <div class="sheet-header">
        <button type="button" class="icon-button" data-year-step="-1" aria-label="Tahun sebelumnya">${CHEVRON_LEFT}</button>
        <button type="button" class="year-toggle" aria-expanded="false" aria-controls="picker-years">
          <span class="year-toggle-text"></span>${CHEVRON_DOWN}
        </button>
        <button type="button" class="icon-button" data-year-step="1" aria-label="Tahun berikutnya">${CHEVRON_RIGHT}</button>
      </div>
      <div class="picker-months" role="listbox" aria-label="Pilih bulan"></div>
      <div class="picker-years" id="picker-years" role="listbox" aria-label="Pilih tahun" hidden></div>
    </div>`;

  const yearText = dialog.querySelector('.year-toggle-text');
  const yearToggle = dialog.querySelector('.year-toggle');
  const monthsBox = dialog.querySelector('.picker-months');
  const yearsBox = dialog.querySelector('.picker-years');
  const stepButtons = dialog.querySelectorAll('[data-year-step]');

  const monthButtons = MONTH_NAMES.map((name, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'picker-option';
    b.setAttribute('role', 'option');
    b.dataset.month = String(i + 1);
    b.textContent = name;
    monthsBox.append(b);
    return b;
  });

  let state = { year: 0, month: 0, selected: null, today: null };
  let yearsBuilt = false;

  function renderMonths() {
    yearText.textContent = String(state.year);
    stepButtons[0].disabled = state.year <= MIN_YEAR;
    stepButtons[1].disabled = state.year >= MAX_YEAR;
    monthButtons.forEach((b, i) => {
      const m = i + 1;
      const isSelected = state.selected.year === state.year && state.selected.month === m;
      b.classList.toggle('is-selected', isSelected);
      b.setAttribute('aria-selected', String(isSelected));
      b.classList.toggle('is-current', state.today.year === state.year && state.today.month === m);
    });
  }

  function buildYears() {
    const frag = document.createDocumentFragment();
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'picker-option';
      b.setAttribute('role', 'option');
      b.dataset.year = String(y);
      b.textContent = String(y);
      frag.append(b);
    }
    yearsBox.append(frag);
    yearsBuilt = true;
  }

  function setYearMode(on) {
    if (on && !yearsBuilt) buildYears();
    yearsBox.hidden = !on;
    monthsBox.hidden = on;
    yearToggle.setAttribute('aria-expanded', String(on));
    dialog.classList.toggle('is-year-mode', on);
    stepButtons.forEach((b) => { b.hidden = on; });
    if (on) {
      yearsBox.querySelectorAll('.picker-option').forEach((b) => {
        const y = Number(b.dataset.year);
        b.classList.toggle('is-selected', y === state.year);
        b.setAttribute('aria-selected', String(y === state.year));
        b.classList.toggle('is-current', y === state.today.year);
      });
      const active = yearsBox.querySelector(`[data-year="${state.year}"]`);
      yearsBox.scrollTop = active.offsetTop - yearsBox.clientHeight / 2 + active.offsetHeight / 2;
    }
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  stepButtons.forEach((b) => b.addEventListener('click', () => {
    state.year = Math.min(MAX_YEAR, Math.max(MIN_YEAR, state.year + Number(b.dataset.yearStep)));
    renderMonths();
  }));

  yearToggle.addEventListener('click', () => setYearMode(yearsBox.hidden));

  monthsBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-month]');
    if (!b) return;
    close();
    onSelect({ year: state.year, month: Number(b.dataset.month) });
  });

  yearsBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-year]');
    if (!b) return;
    state.year = Number(b.dataset.year);
    setYearMode(false);
    renderMonths();
  });

  // Ketuk area gelap di luar sheet untuk menutup.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  return {
    /**
     * @param {{year:number, month:number}} selected bulan yang sedang tampil
     * @param {{year:number, month:number}} today
     */
    open(selected, today) {
      state = { year: selected.year, month: selected.month, selected, today };
      setYearMode(false);
      renderMonths();
      dialog.showModal();
      monthButtons[selected.month - 1].focus({ preventScroll: true });
    },
    close,
  };
}
