# Jadwal Sholat

Aplikasi jadwal sholat untuk Indonesia berbasis [Expo](https://expo.dev) / React Native. Data diambil dari [API Muslim v3 (api.myquran.com)](https://api.myquran.com/v3/doc) — sumber data Kemenag Bimas Islam — dan dilengkapi **widget Android** jadwal sholat hari ini.

Dikembangkan oleh [Sahlil](https://github.com/Sahlil).

## Fitur

- **Pilih kota / kabupaten** — daftar lengkap + pencarian real-time (debounce 300ms)
- **Deteksi lokasi otomatis (GPS)** — tombol "Gunakan Lokasi Saya" di layar Pilih Kota; posisi GPS dipetakan ke kabupaten/kota terdekat dari tabel koordinat lokal (517 kota), lalu tampil sebagai saran yang bisa dikonfirmasi sebelum dipakai
- **Jadwal sholat hari ini** — 8 waktu (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya) dengan penanda otomatis waktu sholat berikutnya
- **Jadwal bulanan** — navigasi antar bulan, highlight hari ini
- **Widget Android 5×1** — pita horizontal berisi 5 waktu wajib (Subuh, Dzuhur, Ashar, Maghrib, Isya) sesuai kota yang dipilih; ketuk untuk membuka aplikasi
- Widget ter-update otomatis (periodik 30 menit) dan langsung saat kota diganti / aplikasi dibuka

## Tech Stack

| Teknologi | Versi |
| --- | --- |
| [Expo SDK](https://docs.expo.dev/versions/v57.0.0/) | 57 |
| React Native | 0.86 |
| React | 19.2 |
| TypeScript | 6.0 |
| [Expo Router](https://docs.expo.dev/router/introduction/) | file-based routing |
| [expo-location](https://docs.expo.dev/versions/v57.0.0/sdk/location/) | deteksi posisi GPS |
| [react-native-android-widget](https://saleksovski.github.io/react-native-android-widget/) | widget home screen Android |
| [@react-native-async-storage/async-storage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/) | persistensi kota terpilih |

## API

Semua data berasal dari [API Muslim v3](https://api.myquran.com/v3/doc) (`https://api.myquran.com/v3`):

| Endpoint | Kegunaan |
| --- | --- |
| `GET /sholat/kabkota/semua` | Daftar seluruh kabupaten/kota |
| `GET /sholat/kabkota/cari/{kata-kunci}` | Pencarian kota |
| `GET /sholat/jadwal/{id}/today` | Jadwal sholat hari ini |
| `GET /sholat/jadwal/{id}/{periode}` | Jadwal bulanan (`YYYY-MM`) atau harian (`YYYY-MM-DD`) |

Dibungkus rapi di `src/api/` dengan penanganan error terpusat (timeout, status HTTP, respon `status: false`).

> Catatan: API tidak menyediakan koordinat per kota, jadi fitur deteksi lokasi memakai tabel koordinat lokal (`src/data/city-coordinates.json`) untuk memetakan GPS ke kabupaten/kota terdekat.

## Deteksi Lokasi (GPS)

Alur fitur "Gunakan Lokasi Saya" di layar Pilih Kota:

1. **Tabel koordinat** — `src/data/city-coordinates.json` berisi `{ id, lokasi, lat, lon }` untuk 517 kota (ID cocok dengan API). Dihasilkan oleh `scripts/generate-city-coordinates.mjs` dari daftar kota API myQuran + dataset [wilayah-indonesia](https://github.com/yusufsyaifudin/wilayah-indonesia) (koordinat yang tidak tersedia di dataset diisi manual dari sumber Kemenag/Wikipedia).
2. **Izin lokasi** — via `expo-location` (`requestForegroundPermissionsAsync`), pesan izin dikonfigurasi di `app.json` (plugin `expo-location`).
3. **Kota terdekat** — koordinat GPS dihitung jaraknya (haversine) ke semua kota; kota terdekat ditampilkan beserta perkiraan jarak untuk dikonfirmasi user sebelum disimpan.
4. **Penyimpanan** — kota hasil deteksi disimpan lewat `saveSelectedCity()` seperti pemilihan manual, sehingga langsung dipakai juga oleh widget.

Logika deteksi ada di `src/hooks/use-location-city.ts`. Jika GPS tidak aktif / izin ditolak / terlalu jauh dari kota mana pun (> 120 km), user diberi pesan dan tetap bisa memilih kota manual.

## Struktur Proyek

```
├── index.ts                      # Entry: expo-router + register widget task handler
├── app.json                      # Konfigurasi Expo + config plugin widget Android & expo-location
├── scripts/
│   └── generate-city-coordinates.mjs  # Generator tabel koordinat kota (jalankan: node scripts/generate-city-coordinates.mjs)
└── src/
    ├── api/
    │   ├── client.ts             # Wrapper fetch (timeout, retry-friendly error)
    │   └── sholat.ts             # Fungsi tipe-aman untuk endpoint myQuran
    ├── app/                      # Screens (Expo Router)
    │   ├── _layout.tsx           # Root Stack + tema
    │   ├── index.tsx             # Beranda: jadwal hari ini + sinkronisasi widget
    │   ├── kota.tsx              # Pilih kota (search + list + deteksi lokasi)
    │   └── jadwal.tsx            # Jadwal bulanan
    ├── components/               # LoadingView, ErrorView, PrayerCard
    ├── constants/theme.ts        # Warna & urutan waktu sholat
    ├── data/
    │   └── city-coordinates.json # Tabel koordinat 517 kabupaten/kota (untuk deteksi lokasi)
    ├── hooks/                    # use-api, use-selected-city, use-location-city
    ├── storage/city.ts           # Persistensi kota terpilih (AsyncStorage)
    ├── types/sholat.ts           # Tipe respons API
    ├── utils/date.ts             # Helper bulan/tanggal & deteksi waktu berikutnya
    └── widgets/
        ├── jadwal-sholat-widget.tsx   # Komponen widget (primitives, 'use no memo')
        └── widget-task-handler.tsx    # Handler background (add/update/click)
```

## Panduan Instalasi & Menjalankan Aplikasi (Penting!)

> **Prasyarat:** Node.js ≥ 22, akun [Expo](https://expo.dev) (login dengan `npx eas login`), dan perangkat/emulator Android.

> **PERHATIAN:** Aplikasi ini **TIDAK BISA dijalankan dengan Expo Go.** Proyek ini menggunakan **Custom Development Build** karena memuat modul native (`react-native-android-widget`, `expo-location`) untuk widget Android dan deteksi lokasi. Pastikan Anda mengikuti langkah-langkah berikut secara berurutan.

### Langkah 1 — Install Dependensi

```bash
npm install
```

### Langkah 2 — Pahami Mengapa Perlu Development Build

**Proyek ini menggunakan Custom Development Build karena memuat modul native untuk widget dan lokasi.** `react-native-android-widget` dan `expo-location` adalah modul native yang hanya tersedia di dalam build khusus (dev client), bukan di Expo Go. Tanpa development build, aplikasi akan error saat mengimpor library tersebut. Karena itu:
- **Jangan** menjalankan proyek ini dengan Expo Go.
- Selalu gunakan development build hasil `EAS Build` (Langkah 3), kemudian tancapkan server lokal (Langkah 4).
- Setiap kali menambah/mengubah modul native (mis. menambah `expo-location`), development build harus di-build ulang.

### Langkah 3 — Bangun APK Development via EAS Cloud

Bangun APK native **development build** dengan memanfaatkan EAS Build di cloud (tanpa perlu Android Studio di mesin lokal):

```bash
eas build -p android --profile development
```

Setelah build selesai, unduh APK-nya dari link yang diberikan EAS dan pasang di perangkat/emulator Android Anda.

### Langkah 4 — Jalankan Server Lokal & Buka Dev Client

Setelah APK development terpasang, jalankan Metro bundler dan buka aplikasi dari dev client:

```bash
npx expo start --dev-client
```

Kemudian buka aplikasi "jadwal-sholat" di perangkat Anda — perangkat akan otomatis terhubung ke server lokal (pastikan perangkat dan komputer berada di jaringan yang sama).

**Selanjutnya:** tambahkan widget **"Jadwal Sholat"** dari launcher Android untuk menikmati fitur widget 5×1.

## Widget Android

### Cara kerja

1. **Kota terpilih** disimpan ke `AsyncStorage` saat diganti di aplikasi (`src/storage/city.ts`).
2. **Update instan:** setiap kali jadwal berhasil dimuat di aplikasi, `requestWidgetUpdate()` mengirim data terbaru ke widget.
3. **Update mandiri:** saat widget ditambahkan (`WIDGET_ADDED`) atau dipicu `updatePeriodMillis` (30 menit), task handler background (`src/widgets/widget-task-handler.tsx`) membaca kota dari storage lalu fetch jadwal hari ini langsung ke API.
4. **Interaksi:** seluruh widget dapat diketuk (`clickAction="OPEN_APP"`) untuk membuka aplikasi.

`'use no memo'` di baris pertama komponen widget wajib dipasang karena project mengaktifkan React Compiler (lihat [dokumentasi library](https://saleksovski.github.io/react-native-android-widget/docs/tutorial/widget-design)).

### Konfigurasi (`app.json`)

Widget diregistrasikan lewat config plugin, termasuk ukuran pita horizontal:

```json
[
  "react-native-android-widget",
  { 
    "widgets": [
      {
        "name": "JadwalSholat",
        "label": "Jadwal Sholat",
        "minWidth": "320dp",
        "minHeight": "70dp",
        "targetCellWidth": 5,
        "targetCellHeight": 1,
        "resizeMode": "horizontal",
        "updatePeriodMillis": 1800000
      }
    ]
  }
]
```

> Widget hanya tersedia di **development build / standalone build** — tidak berfungsi di Expo Go. Ikuti [Panduan Instalasi](#panduan-instalasi--menjalankan-aplikasi-penting) di atas.

## Kontribusi

Pull request dipersilakan. Untuk perubahan besar, silakan buka issue terlebih dahulu untuk mendiskusikan apa yang ingin diubah.

## Lisensi

[MIT](LICENSE)