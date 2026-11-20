/**
 * Dialog reminder memakai SweetAlert2 (disimpan lokal di vendor/, bukan CDN).
 * Library dimuat hanya ketika dibutuhkan agar pembukaan aplikasi tetap ringan.
 */

const SWAL_SCRIPT = 'vendor/sweetalert2/sweetalert2.min.js';
const SWAL_STYLE = 'vendor/sweetalert2/sweetalert2.min.css';

let loading = null;

function loadSweetAlert() {
  const existing = window.Sweetalert2 || window.Swal;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SWAL_STYLE;
    document.head.prepend(link); // sebelum app.css agar gaya kustom menang

    const script = document.createElement('script');
    script.src = SWAL_SCRIPT;
    script.onload = () => resolve(window.Sweetalert2 || window.Swal);
    script.onerror = () => { loading = null; reject(new Error('Gagal memuat SweetAlert2')); };
    document.head.append(script);
  });
  return loading;
}

/** Menampilkan reminder; resolve setelah pengguna menekan "Mengerti". */
export async function showReminderAlert({ message }) {
  const Swal = await loadSweetAlert();
  await Swal.fire({
    title: 'Perbarui data kalender',
    text: message,
    icon: 'info',
    confirmButtonText: 'Mengerti',
    showCancelButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    buttonsStyling: false,
    heightAuto: false,
    focusConfirm: false, // hindari cincin fokus saat dialog muncul tanpa interaksi
    returnFocus: false,
    customClass: {
      popup: 'kal-alert',
      icon: 'kal-alert-icon',
      title: 'kal-alert-title',
      htmlContainer: 'kal-alert-text',
      confirmButton: 'kal-alert-button',
    },
  });
}
