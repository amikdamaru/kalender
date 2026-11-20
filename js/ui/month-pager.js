/**
 * Menampilkan satu bulan di dalam viewport dan menangani perpindahan bulan:
 * gesture swipe horizontal (mengikuti jari) serta animasi geser sesuai arah.
 *
 * Gesture vertikal tidak diganggu: viewport memakai `touch-action: pan-y`
 * dan arah gesture baru dikunci setelah melewati ambang kecil.
 */

import { addMonths, compareMonths } from '../utils/date.js';

const LOCK_THRESHOLD = 8;        // px sebelum arah gesture ditentukan
const COMMIT_RATIO = 0.18;       // proporsi lebar viewport untuk berpindah bulan
const COMMIT_MAX_DISTANCE = 90;  // px
const FLICK_VELOCITY = 0.35;     // px/ms
const FLICK_MIN_DISTANCE = 24;   // px
const DURATION = 280;
const EASING = 'cubic-bezier(0.22, 0.7, 0.3, 1)';

/**
 * @param {{
 *   viewport: HTMLElement,
 *   renderMonth: (ym: {year:number, month:number}) => HTMLElement,
 *   afterMount?: (el: HTMLElement) => void,
 *   onMonthChange?: (ym: {year:number, month:number}) => void,
 *   canNavigate?: (ym: {year:number, month:number}) => boolean,
 * }} options
 */
export function createMonthPager({ viewport, renderMonth, afterMount, onMonthChange, canNavigate = () => true }) {
  let current = null; // { ym, el }
  let running = [];
  const leaving = new Set(); // elemen bulan lama yang sedang dianimasikan keluar
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const removeLeaving = (node) => {
    node.remove();
    leaving.delete(node);
  };

  /** Menuntaskan animasi yang berjalan secara sinkron (mis. saat swipe beruntun). */
  const finishRunning = () => {
    const list = running;
    running = [];
    list.forEach((a) => a.finish());
    leaving.forEach(removeLeaving);
  };

  function mount(ym) {
    const node = renderMonth(ym);
    viewport.append(node);
    afterMount?.(node);
    return node;
  }

  /**
   * @param {{year:number, month:number}} ym
   * @param {{ animate?: boolean, fromOffset?: number }} [opts]
   */
  function show(ym, { animate = true, fromOffset = 0 } = {}) {
    finishRunning();
    const previous = current;
    const direction = previous ? Math.sign(compareMonths(ym, previous.ym)) : 0;
    current = { ym, el: mount(ym) };
    onMonthChange?.(ym);
    if (!previous) return;

    const oldEl = previous.el;
    if (!animate || direction === 0 || reducedMotion.matches) {
      oldEl.remove();
      return;
    }
    const width = viewport.clientWidth;
    const timing = { duration: DURATION, easing: EASING };
    const outAnim = oldEl.animate(
      [
        { transform: `translateX(${fromOffset}px)`, opacity: 1 },
        { transform: `translateX(${-direction * width}px)`, opacity: 0.2 },
      ],
      { ...timing, fill: 'forwards' },
    );
    const inAnim = current.el.animate(
      [
        { transform: `translateX(${direction * width + fromOffset}px)`, opacity: 0.2 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      timing,
    );
    oldEl.style.transform = '';
    leaving.add(oldEl);
    outAnim.onfinish = () => removeLeaving(oldEl);
    outAnim.oncancel = () => removeLeaving(oldEl);
    setTimeout(() => leaving.has(oldEl) && removeLeaving(oldEl), DURATION + 200); // pengaman bila event finish tidak terpicu
    running = [outAnim, inAnim];
  }

  function step(delta, fromOffset = 0) {
    const target = addMonths(current.ym, delta);
    if (!canNavigate(target)) return settle(fromOffset);
    show(target, { fromOffset });
  }

  /** Mengembalikan bulan aktif ke posisi semula setelah swipe yang dibatalkan. */
  function settle(fromOffset) {
    const node = current.el;
    node.style.transform = '';
    if (!fromOffset || reducedMotion.matches) return;
    running.push(node.animate(
      [{ transform: `translateX(${fromOffset}px)` }, { transform: 'translateX(0)' }],
      { duration: 200, easing: EASING },
    ));
  }

  // ---- Gesture swipe -------------------------------------------------------
  let gesture = null; // { id, x, y, t, axis, dx, lastX, lastT, velocity }

  viewport.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0 || !current) return;
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, dx: 0, lastX: e.clientX, lastT: e.timeStamp, velocity: 0 };
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    if (!gesture.axis) {
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (gesture.axis === 'y') { gesture = null; return; }
      finishRunning();
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        /* pointer sudah dilepas — gesture tetap berjalan tanpa capture */
      }
      viewport.classList.add('is-dragging');
    }
    const dt = e.timeStamp - gesture.lastT;
    if (dt > 0) gesture.velocity = (e.clientX - gesture.lastX) / dt;
    gesture.lastX = e.clientX;
    gesture.lastT = e.timeStamp;
    gesture.dx = dx;
    current.el.style.transform = `translateX(${dx}px)`;
  });

  const endGesture = (e, cancelled) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    const { axis, dx, velocity } = gesture;
    gesture = null;
    viewport.classList.remove('is-dragging');
    if (axis !== 'x') return;

    const distance = Math.min(COMMIT_MAX_DISTANCE, viewport.clientWidth * COMMIT_RATIO);
    const flick = Math.abs(velocity) > FLICK_VELOCITY && Math.abs(dx) > FLICK_MIN_DISTANCE && Math.sign(velocity) === Math.sign(dx);
    if (!cancelled && (Math.abs(dx) > distance || flick)) {
      step(dx < 0 ? 1 : -1, dx); // swipe kiri → bulan berikutnya
    } else {
      settle(dx);
    }
  };
  viewport.addEventListener('pointerup', (e) => endGesture(e, false));
  viewport.addEventListener('pointercancel', (e) => endGesture(e, true));

  return {
    show,
    step,
    /** Render ulang bulan aktif tanpa animasi (mis. setelah "hari ini" berubah). */
    refresh: () => current && show(current.ym, { animate: false }),
    get current() { return current?.ym ?? null; },
    get element() { return current?.el ?? null; },
  };
}
