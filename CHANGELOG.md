# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Nomor versi sama dengan `CACHE_VERSION` di `sw.js`.

## [1.0.0] — 2026-11-20

Versi pertama yang ditulis ulang total dari prototipe sebelumnya.

### Ditambahkan
- Kalender bulanan dengan grid 6 × 7 tetap, urutan Senin–Minggu, dan nama hari lengkap.
- Nomor minggu ISO 8601 di setiap baris.
- Informasi hari ini dalam WIB (Asia/Jakarta), misalnya "Jumat, 20 November 2026", beserta highlight di grid.
- Aturan warna tanggal:
  - Jumat hijau.
  - Sabtu, Minggu, libur nasional, dan cuti bersama merah.
  - Tanggal bulan lain abu-abu muda.
- Data hari libur nasional dan cuti bersama 2021–2027 dari SKB 3 Menteri, termasuk semua SKB perubahan, lengkap dengan metadata sumber. Tahun 2028–2031 ditandai belum tersedia.
- Nama hari libur tampil di kotak tanggal, dengan indikator titik dan ukuran teks yang menyesuaikan otomatis.
- Navigasi bulan dengan swipe yang mengikuti jari, plus animasi geser sesuai arah.
- Pemilih bulan dan tahun berupa bottom sheet, dengan grid bulan dan daftar tahun 1900–2100.
- Reminder pembaruan data hari libur (SweetAlert2, disimpan lokal). Reminder muncul sekali per tahun target, dengan key `holiday_reminder_shown_<tahun>`.
- PWA:
  - Manifest dan ikon (any + maskable).
  - Service Worker dengan precache berversi, mode offline, dan pembaruan otomatis.
- Pengujian otomatis di browser (`tests/`).
- Dokumentasi `README.md` dan `HOLIDAY_DATA.md`.

### Dihapus
- Fitur catatan per tanggal, tombol panah, dan tombol "Hari ini" dari prototipe lama, karena di luar ruang lingkup.
- `manifest.json` diganti dengan `manifest.webmanifest`.
