# Kalender

Aplikasi kalender bulanan pribadi yang minimalis, tanpa iklan, tanpa akun, dan dapat di-install di Android sebagai Progressive Web App (PWA).

- Grid bulanan selalu 6 × 7 dengan urutan Senin–Minggu dan nama hari lengkap.
- Hari libur nasional dan cuti bersama Indonesia 2021–2027, diambil dari SKB 3 Menteri. Nama hari libur tampil langsung di kotak tanggal.
- Warna tanggal:
  - Jumat hijau.
  - Sabtu, Minggu, libur nasional, dan cuti bersama merah.
  - Tanggal bulan lain abu-abu muda.
  - Hari ini memakai lingkaran yang warnanya mengikuti jenis hari.
- Nomor minggu ISO 8601 di sisi kiri setiap baris.
- Pindah bulan dengan swipe kiri/kanan. Ketuk nama bulan untuk memilih bulan dan tahun secara langsung.
- "Hari ini" selalu mengikuti zona waktu **Asia/Jakarta (WIB)**, apa pun zona waktu perangkatnya.
- Reminder (SweetAlert2) muncul bila data hari libur tahun berikutnya belum tersedia. Lihat [HOLIDAY_DATA.md](HOLIDAY_DATA.md).
- Tetap berfungsi offline setelah dibuka sekali.

## Teknologi

- HTML, CSS, dan JavaScript murni (ES modules). **Tanpa framework dan tanpa build step.**
- SweetAlert2 v11.14.5 (lisensi MIT), disimpan lokal di `vendor/` dan baru dimuat saat reminder perlu tampil. Aplikasi tidak memakai CDN saat berjalan.
- Font sistem. Tidak ada font eksternal, analytics, atau request ke API luar.

## Struktur folder

```
.
├── index.html               # Kerangka halaman
├── manifest.webmanifest     # Konfigurasi PWA
├── sw.js                    # Service Worker (precache + pembaruan versi)
├── .nojekyll                # Agar GitHub Pages menyajikan file apa adanya
├── css/app.css              # Seluruh gaya (light mode)
├── data/holidays.json       # Data hari libur + metadata sumber resmi
├── icons/                   # Ikon PWA (sumber SVG + PNG hasil render)
├── js/
│   ├── main.js              # Titik masuk: merangkai semua modul
│   ├── config.js            # Konstanta (zona waktu, nama bulan/hari, key storage)
│   ├── utils/date.js        # Utilitas tanggal bebas zona waktu, ISO week, tanggal WIB
│   ├── utils/storage.js     # Pembungkus localStorage yang aman
│   ├── calendar/month-grid.js        # Model grid 6×7 + aturan warna (tanpa DOM)
│   ├── holidays/holiday-repository.js # Pemuatan, pencarian & validasi data libur
│   ├── reminder/holiday-reminder.js   # Logika reminder (murni, mudah diuji)
│   ├── ui/calendar-view.js  # Render grid ke DOM + penyesuaian ukuran label
│   ├── ui/month-pager.js    # Swipe + animasi perpindahan bulan
│   ├── ui/month-picker.js   # Bottom sheet pemilih bulan & tahun
│   ├── ui/alert.js          # Dialog reminder (SweetAlert2, lazy-load)
│   └── pwa/register-sw.js   # Registrasi & pembaruan Service Worker
├── vendor/sweetalert2/      # SweetAlert2 (min.js, min.css, LICENSE)
└── tests/                   # Pengujian otomatis di browser
```

## Menjalankan secara lokal

ES modules dan Service Worker butuh server HTTP. Membuka `index.html` langsung lewat `file://` tidak akan berjalan. Pilih salah satu cara berikut:

```bash
# PHP (sudah ada di XAMPP)
php -S 127.0.0.1:8080

# atau Python
python -m http.server 8080

# atau Node
npx serve .
```

Lalu buka `http://127.0.0.1:8080/`. Bila folder ini ada di `htdocs` XAMPP, aplikasi juga bisa dibuka di `http://localhost/kalender/`.

Proyek ini tidak punya langkah build. File di repositori itulah yang di-deploy.

### Pengujian

Buka `http://127.0.0.1:8080/tests/` di browser. Halaman ini menguji:
- Tahun kabisat.
- Grid 6×7 untuk setiap bulan 1900–2100.
- ISO week, termasuk verifikasi silang setiap hari 1950–2100.
- Perhitungan tanggal WIB.
- Aturan warna.
- Validitas dan jumlah data hari libur per tahun.
- Reminder dengan tanggal simulasi.

Hasil yang diharapkan: **LULUS** untuk semua pengujian.

### Simulasi tanggal

Tambahkan `?today=YYYY-MM-DD` pada URL, misalnya `/?today=2027-01-15`, agar aplikasi menganggap tanggal tersebut sebagai hari ini. Cara ini berguna untuk menguji highlight dan reminder.

## Deployment ke GitHub Pages

1. Push repositori ke GitHub.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Source: Deploy from a branch**, lalu **Branch: `main`** dengan folder **`/ (root)`**.
4. Tunggu beberapa saat. Aplikasi akan tersedia di `https://USERNAME.github.io/REPOSITORY/`.

Semua path di aplikasi bersifat relatif (`./`), jadi aplikasi berjalan di subpath repositori tanpa konfigurasi tambahan. Aplikasi juga tidak memakai routing, sehingga tidak butuh fallback 404.

### Setiap kali merilis perubahan

1. Ubah file yang diperlukan.
2. **Naikkan `CACHE_VERSION` di `sw.js`**, misalnya `1.0.0` → `1.0.1`.
   - Jika ada file baru, tambahkan juga ke `PRECACHE_URLS`.
   - Tanpa langkah ini, pengguna yang sudah meng-install akan tetap memakai aset lama dari cache.
3. Catat perubahan di [CHANGELOG.md](CHANGELOG.md), lalu commit dan push.

Saat aplikasi dibuka kembali, Service Worker baru otomatis terpasang. Cache lama dihapus dan halaman dimuat ulang sekali.

## Install di Chrome Android

1. Buka `https://USERNAME.github.io/REPOSITORY/` di Google Chrome Android. HTTPS wajib, dan GitHub Pages sudah menyediakannya.
2. Ketuk menu **⋮**, lalu **Install app** (atau **Tambahkan ke layar utama → Install**).
3. Ikon **Kalender** muncul di layar utama. Saat dibuka, aplikasi tampil layar penuh (standalone) dengan splash screen sederhana: ikon dan nama di atas latar off-white.
