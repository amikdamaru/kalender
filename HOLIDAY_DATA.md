# Data Hari Libur Nasional & Cuti Bersama

Seluruh data ada di satu file statis, [`data/holidays.json`](data/holidays.json). Aplikasi tidak memanggil API apa pun. Data ikut di-cache oleh Service Worker, jadi tetap tersedia saat offline.

## Struktur data

```jsonc
{
  "schemaVersion": 1,
  "lastUpdated": "2026-11-20",          // tanggal terakhir data diperbarui
  "coverage": { "from": 2021, "to": 2031 },

  "sources": {                          // metadata sumber resmi, dirujuk lewat id
    "skb-2027": {
      "title": "Keputusan Bersama Menteri Agama, ... Nomor 1205 Tahun 2026, ...",
      "issuedDate": "2026-09-15",       // tanggal penetapan (null bila belum terkonfirmasi)
      "urls": ["https://setneg.go.id/...", "https://kemenkopmk.go.id/...pdf"],
      "verification": "verified_official",
      "notes": "Catatan perubahan/revisi"
    }
  },

  "years": {                            // status ketersediaan per tahun
    "2027": { "status": "available", "source": "skb-2027" },
    "2028": { "status": "not_available", "source": null, "notes": "SKB belum ditetapkan pemerintah." }
  },

  "holidays": [
    {
      "date": "2027-03-10",             // YYYY-MM-DD
      "name": "Idulfitri 1448 Hijriah", // nama sesuai dokumen resmi
      "category": "national_holiday",   // national_holiday | collective_leave
      "year": 2027,                     // harus sama dengan tahun pada date
      "source": "skb-2027"              // id di "sources"
    }
  ]
}
```

Catatan:
- Satu tanggal boleh punya lebih dari satu entri, misalnya 13 Mei 2021 (Kenaikan Isa Almasih dan Idul Fitri). Semua nama akan ditampilkan.
- Untuk entri `collective_leave`, aplikasi menambahkan awalan "Cuti Bersama" pada label. Kolom `name` tetap berisi nama hari raya saja.
- Nilai `verification`:
  - `verified_official`: dicocokkan dengan situs pemerintah (setneg.go.id, setkab.go.id, kemenkopmk.go.id, menpan.go.id).
  - `verified_secondary`: daftar akhirnya dikonfirmasi lewat siaran pers pemerintah yang dikutip media, karena PDF SKB resminya berupa hasil pindaian.

## Sumber data saat ini

| Tahun | Dasar hukum (beserta perubahan) | Libur nasional | Cuti bersama | Verifikasi |
|---|---|---|---|---|
| 2021 | SKB 642/2020, 4/2020, 4/2020; perubahan terakhir SKB 712/2021, 1/2021, 3/2021 | 16 entri (15 tanggal) | 1 | secondary |
| 2022 | SKB 963/2021, 3/2021, 4/2021; perubahan 375/2022, 1/2022, 1/2022 (7 Apr 2022) dan perubahan Iduladha → 10 Juli (7 Jul 2022) | 16 | 4 | official |
| 2023 | SKB 1066/2022, 3/2022, 3/2022; perubahan 327/2023, 1/2023, 1/2023 dan 624/2023, 2/2023, 2/2023 | 16 | 11 | official |
| 2024 | SKB 855/2023, 3/2023, 4/2023 (nomenklatur sesuai Keppres 8/2024) | 17 | 10 | official |
| 2025 | SKB 1017/2024, 2/2024, 2/2024; perubahan 933/2025, 1/2025, 3/2025 (cuti bersama 18 Agustus) | 17 | 11 | official |
| 2026 | SKB 1497/2025, 2/2025, 5/2025 | 17 | 8 | official |
| 2027 | SKB 1205/2026, 3/2026, 2/2026 (15 Sep 2026) | 18 | 8 | official |
| 2028–2031 | Belum ditetapkan, sehingga **belum ada data** | – | – | – |

URL lengkap setiap sumber ada di bagian `sources` pada file JSON.

Data untuk tahun yang belum ditetapkan sengaja dikosongkan. Jangan pernah mengisi tanggal perkiraan atau prediksi.

## Menambahkan data tahun baru

Biasanya SKB 3 Menteri untuk tahun Y terbit sekitar September–Oktober tahun Y-1.

1. Cari SKB resminya di setneg.go.id, setkab.go.id, kemenkopmk.go.id, atau menpan.go.id.
2. Tambahkan entri di `sources`. Contoh:
   ```json
   "skb-2028": {
     "title": "Keputusan Bersama ... Nomor ... tentang Hari Libur Nasional dan Cuti Bersama Tahun 2028",
     "issuedDate": "2027-09-xx",
     "urls": ["https://..."],
     "verification": "verified_official",
     "notes": ""
   }
   ```
3. Tambahkan setiap tanggal ke `holidays`, dengan `category` yang sesuai dan `"source": "skb-2028"`. Jika satu hari raya mencakup beberapa hari, buat satu entri per tanggal.
4. Ubah status tahun tersebut menjadi `"2028": { "status": "available", "source": "skb-2028" }`.
5. Bila cakupan bertambah, perbarui `coverage.to`. Perbarui juga `lastUpdated`.
6. Naikkan `CACHE_VERSION` di `sw.js` agar pengguna mendapat data baru, lalu catat di `CHANGELOG.md`.

Jika pemerintah menerbitkan **SKB perubahan**, perbarui atau hapus entri yang terdampak. Tambahkan nomor SKB perubahan ke `title`/`notes` sumber, lalu tambahkan URL-nya.

## Memverifikasi data

1. Jalankan server lokal dan buka `/tests/`. Pengujian akan memeriksa:
   - Setiap tanggal valid, dan `year` cocok dengan tanggalnya.
   - Kategori valid, dan setiap `source` ada.
   - Tidak ada entri ganda.
   - Tahun berstatus `available` punya data, dan tahun lainnya kosong.
   - Jumlah libur nasional dan cuti bersama per tahun. **Untuk tahun baru, tambahkan jumlahnya** ke tabel `expected` di `tests/tests.js`, sesuai angka yang tertulis di SKB.
2. Cocokkan setiap tanggal dan nama dengan dokumen SKB, lalu periksa pengumuman revisi terbaru.
3. Buka aplikasi dan periksa bulan-bulan yang berisi hari libur, misalnya dengan `/?today=2028-01-01`.

## Mengubah status ketersediaan data

Ketersediaan data ditentukan **hanya** oleh `years.<tahun>.status`:

- `"available"`: data resmi sudah lengkap, dan reminder untuk tahun itu tidak akan muncul.
- `"not_available"` (atau tahun tidak tercantum): reminder akan muncul sesuai aturan di bawah.

## Aturan reminder pembaruan data

Untuk setiap tahun target **Y** yang statusnya belum `available`:

- Reminder aktif mulai **1 Januari Y-1 (WIB)**. Artinya, pada tanggal T, tahun yang diperiksa adalah `coverage.from` sampai `T.year + 1`.
- Reminder tampil saat aplikasi dibuka pada atau setelah tanggal itu. Jika aplikasi baru dibuka pada 15 Januari, reminder tetap muncul.
- Isi pesannya: *"Data hari libur nasional dan cuti bersama tahun Y belum tersedia. Silakan lakukan pembaruan data kalender."* Hanya ada satu tombol, **Mengerti**.
- Setelah tombol ditekan, status disimpan di localStorage dengan key per tahun: `holiday_reminder_shown_<Y>`, misalnya `holiday_reminder_shown_2028`. Reminder tahun itu tidak akan muncul lagi.
- Setiap tahun punya key sendiri. Begitu data tahun Y diperbarui menjadi `available`, reminder berhenti, dan key lamanya dihapus otomatis.

Contoh: data 2028 belum ada, jadi mulai 1 Januari 2027 aplikasi akan menampilkan reminder untuk 2028.

## Menguji reminder

**Otomatis.** Buka `/tests/`. Bagian "Reminder" menguji tanggal pemicu, "hanya sekali", status per tahun, data yang sudah diperbarui, dan reminder yang gagal tampil. Semua pengujian ini memakai tanggal simulasi dan storage tiruan.

**Manual di browser.**
1. Buka `/?today=2026-12-31`. Reminder tidak muncul, karena data 2027 sudah tersedia.
2. Buka `/?today=2027-01-01`. Muncul reminder untuk tahun 2028. Tekan **Mengerti**.
3. Muat ulang `/?today=2027-01-15`. Reminder tidak muncul lagi.
4. Buka `/?today=2028-01-01`. Muncul reminder untuk 2029. Reminder 2028 tidak muncul karena sudah ditampilkan.
5. Untuk mengulang pengujian, hapus key `holiday_reminder_shown_*` lewat DevTools → Application → Local Storage.
