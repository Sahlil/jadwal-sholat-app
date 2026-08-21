# ayo sholat

Aplikasi jadwal sholat untuk Indonesia berbasis [Expo](https://expo.dev) / React Native. Data diambil dari [API Muslim v3 (api.myquran.com)](https://api.myquran.com/v3/doc) — sumber data Kemenag Bimas Islam — dan dilengkapi **widget Android** jadwal sholat hari ini.

Dikembangkan oleh [Sahlil](https://github.com/Sahlil).

## Fitur

- **Pilih kota / kabupaten** — daftar lengkap + pencarian real-time (debounce 300ms)
- **Deteksi lokasi otomatis (GPS)** — tombol "Gunakan Lokasi Saya" di layar Pilih Kota; posisi GPS dipetakan ke kabupaten/kota terdekat dari tabel koordinat lokal (517 kota), lalu tampil sebagai saran yang bisa dikonfirmasi sebelum dipakai
- **Jadwal sholat hari ini** — 8 waktu (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya) dengan penanda otomatis waktu sholat berikutnya
- **Jadwal bulanan** — navigasi antar bulan, highlight hari ini
- **Widget Android 5×1** — pita horizontal berisi 5 waktu wajib (Subuh, Dzuhur, Ashar, Maghrib, Isya) sesuai kota yang dipilih; ketuk untuk membuka aplikasi
- Widget ter-update otomatis (periodik 30 menit) dan langsung saat kota diganti / aplikasi dibuka
- **Pengingat Sholat (Notifikasi Lokal)** — notifikasi sebelum waktu sholat (7 waktu tanpa Terbit) dengan offset global (5/10/15/30 menit) dan toggle per-waktu; dijadwalkan presisi hingga 30 hari ke depan lalu disinkronkan ulang setiap aplikasi dibuka
- **Dukungan Offline (SQLite)** — jadwal satu tahun penuh per kota diunduh ke database lokal (`expo-sqlite`); aplikasi berfungsi penuh tanpa internet, data dibaca instan dari DB lalu di-refresh di background. Retensi kota memakai strategi LRU (maks. 5 kota terakhir digunakan)
- **Kompas Arah Kiblat** — jarum kompas real-time menunjuk Kaaba memakai sensor magnetometer + gravity via `useAnimatedSensor` (reanimated, komputasi di UI thread/C++ tanpa JS bridge), dikoreksi kemiringan, deklinasi magnetik, dan koordinat pengguna (GPS atau kota aktif). Dilengkapi peringatan kalibrasi rendah bila sensor terganggu

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
| [expo-notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) | pengingat sholat (notifikasi lokal, trigger presisi) |
| [expo-sqlite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) | database lokal offline (jadwal satu tahun per kota) |
| [@react-native-async-storage/async-storage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/) | persistensi kota terpilih, pengaturan & cache ringan |

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

## Pengingat Sholat (Notifikasi Lokal)

Fitur pengingat memakai `expo-notifications` untuk menjadwalkan notifikasi lokal sebelum waktu sholat. Akses dari beranda melalui tombol **"Pengingat Sholat"** (`src/app/pengingat.tsx`).

- **7 waktu** yang bisa diingatkan (Imsak, Subuh, Dhuha, Dzuhur, Ashar, Maghrib, Isya — tanpa Terbit) dengan toggle per-waktu.
- **Offset global** (5/10/15/30 menit) berlaku untuk semua waktu aktif.
- **Akurasi anti-drift:** alih-alih trigger `DAILY` yang bisa meleset, jadwal **trigger `DATE` untuk 30 hari ke depan** (`REMINDER_WINDOW_DAYS`) dihitung dari jadwal lokal, lalu disinkronkan ulang setiap aplikasi dibuka.
- Persetujuan izin & konfigurasi channel menangani ketentuan Android 13+ (`POST_NOTIFICATIONS`) dan izin exact-alarm Android 12+ (`SCHEDULE_EXACT_ALARM`, di `app.json`).
- Logika ada di `src/services/reminders.ts`; pengaturan tersimpan di `src/storage/reminders.ts`.

## Dukungan Offline (SQLite)

Jadwal sholat disimpan di database lokal `expo-sqlite` sehingga aplikasi tetap berfungsi penuh di area dengan sinyal tidak stabil.

- **Satu tahun penuh per kota** diunduh ke SQLite saat kota dipilih / aplikasi dibuka (`src/services/offline.ts`). Unduhan bertahap per bulan (idempotent), hanya bulan yang belum ada / basi (> 7 hari) yang di-refresh; otomatis menarik tahun berikutnya saat mendekati akhir tahun.
- **Offline-first:** layar beranda & jadwal bulanan membaca dari DB terlebih dahulu (instan), lalu di-refresh dari API di background (`src/hooks/use-schedule.ts`).
- **Pengingat ikut offline** — jadwal trigger dibaca dari DB lokal, tidak lagi bergantung jaringan.
- **Retensi LRU:** data kota tidak dihapus saat berpindah kota — kota baru ditambahkan, dan saat total kota melebihi **5** (`CITY_CACHE_CAP`), kota yang paling lama tidak digunakan dihapus (tabel di-key `city_id`, sehingga kembali ke kota yang baru dikunjungi tetap instan offline).
- Skema DB & migrasi di `src/storage/db.ts`; operasi baca/tulis di `src/storage/schedule-repo.ts`.

## Kompas Arah Kiblat

Fitur kompas diakses dari beranda melalui tombol **"Arah Kiblat"** (`src/app/kiblat.tsx`).

- **Sensor tanpa bridge:** memakai `useAnimatedSensor` bawaan react-native-reanimated (`SensorType.MAGNETIC_FIELD` + `SensorType.GRAVITY`, interval 100ms). Semua perhitungan (kompensasi kemiringan, heading, rotasi jarum) dieksekusi sebagai **worklet di UI thread/C++**, sehingga data sensor tidak menyeberang JS bridge.
- **Arah Kiblat:** dihitung dari koordinat pengguna (GPS bila diizinkan, fallback koordinat kota aktif) ke Kaaba via initial bearing, lalu dikoreksi **deklinasi magnetik** (interpolasi grid `src/data/declination-grid.json`).
- **Grid deklinasi** dibangkitkan deterministik dari model dipole geomagnetik oleh `scripts/generate-declination-grid.mjs` (jalankan `node scripts/generate-declination-grid.mjs`).
- **Peringatan kalibrasi:** karena OS tidak mengekspos akurasi sensor, deteksi memakai heuristik kekuatan medan magnet (`|B|` di luar rentang wajar); saat terdeteksi gangguan, muncul teks berkedip yang menyarankan menggerakkan perangkat membentuk angka 8.
- Utilitas matematika di `src/utils/qibla.ts` & `src/utils/declination.ts`; state/logika di `src/hooks/use-qibla.ts`.

## Widget Android

Fitur widget menampilkan jadwal **5 waktu wajib** hari ini (Subuh, Dzuhur, Ashar, Maghrib, Isya) di home screen sesuai kota yang dipilih. Tambahkan widget **"Jadwal Sholat"** (pita 5×1) dari launcher Android.

- **Update instan:** setiap kali jadwal berhasil dimuat di aplikasi, `requestWidgetUpdate()` mengirim data terbaru ke widget.
- **Update mandiri:** saat widget ditambahkan (`WIDGET_ADDED`) atau dipicu `updatePeriodMillis` (30 menit), task handler background membaca kota dari storage lalu fetch jadwal hari ini langsung ke API.
- **Interaksi:** seluruh widget dapat diketuk (`clickAction="OPEN_APP"`) untuk membuka aplikasi.
- **`'use no memo'`** di baris pertama komponen widget wajib dipasang karena project mengaktifkan React Compiler (lihat [dokumentasi library](https://saleksovski.github.io/react-native-android-widget/docs/tutorial/widget-design)).
- Komponen widget di `src/widgets/jadwal-sholat-widget.tsx`; handler background di `src/widgets/widget-task-handler.tsx`.

> Widget hanya tersedia di **development build / standalone build** — tidak berfungsi di Expo Go. Ikuti [Panduan Instalasi](#panduan-instalasi--menjalankan-aplikasi-penting) di atas.

## Struktur Proyek

```
├── index.ts                      # Entry: expo-router + register widget task handler
├── app.json                      # Konfigurasi Expo + config plugin widget Android & expo-location
├── app.config.js                 # Konfigurasi dinamis: optimasi ukuran arm64 untuk profil github-release/preview
├── scripts/
│   ├── generate-city-coordinates.mjs  # Generator tabel koordinat kota (jalankan: node scripts/generate-city-coordinates.mjs)
│   └── generate-declination-grid.mjs  # Generator grid deklinasi magnetik (jalankan: node scripts/generate-declination-grid.mjs)
└── src/
    ├── api/
    │   ├── client.ts             # Wrapper fetch (timeout, retry-friendly error)
    │   └── sholat.ts             # Fungsi tipe-aman untuk endpoint myQuran
    ├── app/                      # Screens (Expo Router)
    │   ├── _layout.tsx           # Root Stack + tema + handler notifikasi
    │   ├── index.tsx             # Beranda: jadwal hari ini + sinkronisasi widget & pengingat
    │   ├── kota.tsx              # Pilih kota (search + list + deteksi lokasi)
    │   ├── jadwal.tsx            # Jadwal bulanan
    │   ├── pengingat.tsx         # Pengaturan pengingat sholat
    │   └── kiblat.tsx            # Kompas arah kiblat
    ├── components/               # LoadingView, ErrorView, PrayerCard
    ├── constants/theme.ts        # Warna & urutan waktu sholat
    ├── data/
    │   ├── city-coordinates.json # Tabel koordinat 517 kabupaten/kota (untuk deteksi lokasi)
    │   └── declination-grid.json # Grid deklinasi magnetik (dihasilkan script)
    ├── hooks/                    # use-api, use-selected-city, use-location-city, use-schedule, use-qibla
    ├── services/
    │   ├── reminders.ts          # Notifikasi: handler, channel, izin, jadwal window 30 hari
    │   └── offline.ts            # Sinkronisasi jadwal tahunan ke SQLite (retensi LRU)
    ├── storage/
    │   ├── city.ts               # Persistensi kota terpilih (AsyncStorage)
    │   ├── reminders.ts          # Persistensi pengaturan pengingat (AsyncStorage)
    │   ├── cache.ts              # Cache ringan AsyncStorage (daftar kota & widget)
    │   ├── db.ts                 # Buka & migrasi database SQLite
    │   └── schedule-repo.ts      # Repository jadwal (upsert/get/stale/evict) di SQLite
    ├── types/sholat.ts           # Tipe respons API
    ├── utils/
    │   ├── date.ts               # Helper bulan/tanggal & deteksi waktu berikutnya
    │   ├── qibla.ts              # Bearing Kiblat, heading magnetik, heuristik kalibrasi (worklet)
    │   └── declination.ts        # Interpolasi bilinear deklinasi magnetik
    └── widgets/
        ├── jadwal-sholat-widget.tsx   # Komponen widget (primitives, 'use no memo')
        └── widget-task-handler.tsx    # Handler background (add/update/click)
```

## Panduan Instalasi & Menjalankan Aplikasi (Penting!)

> **Prasyarat:** Node.js ≥ 22, akun [Expo](https://expo.dev) (login dengan `npx eas login`), dan perangkat/emulator Android.

> **PERHATIAN:** Aplikasi ini **TIDAK BISA dijalankan dengan Expo Go.** Proyek ini menggunakan **Custom Development Build** karena memuat modul native (`react-native-android-widget`, `expo-location`, `expo-notifications`, `expo-sqlite`) untuk widget Android, deteksi lokasi, pengingat, dan database offline. Pastikan Anda mengikuti langkah-langkah berikut secara berurutan.

### Langkah 1 — Install Dependensi

```bash
npm install
```

### Langkah 2 — Pahami Mengapa Perlu Development Build

**Proyek ini menggunakan Custom Development Build karena memuat modul native untuk widget, lokasi, pengingat, dan database offline.** `react-native-android-widget`, `expo-location`, `expo-notifications`, dan `expo-sqlite` adalah modul native yang hanya tersedia di dalam build khusus (dev client), bukan di Expo Go. Tanpa development build, aplikasi akan error saat mengimpor library tersebut. Karena itu:
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

## Build APK untuk GitHub Release

Untuk mendistribusikan aplikasi melalui GitHub Release (bukan Play Store), gunakan profil build `github-release`. Profil ini menghasilkan **APK arm64-v8a** (bukan AAB) yang siap dipasang langsung di perangkat, dengan ukuran jauh lebih kecil karena hanya memuat native library satu arsitektur.

```bash
eas build --platform android --profile github-release --non-interactive
```

Setelah build selesai, unduh APK dari link yang diberikan EAS dan lampirkan ke Release GitHub Anda.

### Mengapa profil `github-release`?

- **`buildType: "apk"`** — menghasilkan APK siap pasang langsung di perangkat (Android App Bundle `aab` hanya berguna untuk distribusi via Google Play).
- **`app.config.js`** (via plugin `expo-build-properties`) men-set `buildArchs: ["arm64-v8a"]` — sehingga APK hanya memuat native library arsitektur **arm64-v8a** (bukan 4 ABI sekaligus) dan ukurannya turun drastis. Optimasi tambahan: `enableBundleCompression` (kompres bundle JS), `enableMinifyInReleaseBuilds` (R8), dan `enableShrinkResourcesInReleaseBuilds` (buang resource tak terpakai). Optimasi ini **hanya aktif untuk profil `github-release` & `preview`**; profil `development`/`production` tetap memuat semua ABI.
- **`env: { NODE_ENV: "production" }`** — memastikan kode development / dev-only tidak ikut ter-bundle, sehingga ukuran APK minimal.
- **`app.json`** menambahkan `jsEngine: "hermes"` (runtime Hermes, default di SDK 57) dan `enableProguardInReleaseBuilds: true` (ProGuard membuang kode yang tak terpakai) untuk menekan ukuran APK sekecil mungkin.

> **Kompatibilitas:** APK `github-release` hanya berjalan di perangkat **arm64** (praktis semua ponsel 2017+). Perangkat 32-bit (armeabi-v7a) atau emulator x86 tidak dapat menginstalnya — konsekuensi wajar dari APK berukuran kecil untuk rilis GitHub.

> **Catatan:** Karena distribusi lewat GitHub Release, profil ini tidak di-set untuk submit ke Google Play. Pastikan Anda sudah login EAS (`npx eas login`) sebelum menjalankan perintah build di atas.

### Build lokal dengan `--local`

EAS Build bisa dijalankan di mesin Anda sendiri (bukan di cloud) dengan menambahkan opsi `--local`. Ini berguna bila Anda ingin membangun tanpa mengunggah ke server EAS, misalnya untuk menghemat kuota build atau membutuhkan kendali penuh atas proses Gradle.

```bash
eas build --platform android --profile github-release --local --non-interactive
```

Persyaratan untuk build lokal:

- **JDK 17** terpasang (diperlukan oleh React Native / Gradle).
- **Android SDK** terpasang (bisa lewat Android Studio) dengan variabel lingkungan `ANDROID_HOME` di-set.
- **Kredensial keystore**: EAS menanganinya otomatis — bila belum ada keystore lokal, EAS akan menampilkan prompt untuk membuatnya (interaktif) atau memakai keystore yang tersimpan di server EAS. Gunakan `--non-interactive` hanya jika keystore sudah tersedia.

> **Catatan:** `--local` juga berlaku untuk profil lain (mis. `eas build -p android --profile production --local`).

### Profil `production`

Profil `production` adalah profil build rilis standar. Perbedaan utamanya dengan `github-release`:

| Aspek | `github-release` | `production` |
| --- | --- | --- |
| Output | APK arm64-v8a (`buildType: "apk"` + `buildArchs` di `app.config.js`) | AAB (`android.applicationBundle`) — format rilis Play Store |
| `autoIncrement` | tidak | ya (versi naik otomatis tiap build) |
| Tujuan | GitHub Release / instal manual | upload ke Google Play (`eas submit`) |
| Ukuran | lebih kecil (NODE_ENV=production + ProGuard + arm64-only + bundle compression/shrink) | standar |

Untuk membangun dengan profil `production`:

```bash
eas build --platform android --profile production
```

Hasilnya berupa file **AAB**, yang **tidak bisa langsung dipasang** di perangkat — file ini untuk di-upload ke Google Play Console. Gunakan profil `github-release` bila Anda butuh APK yang bisa diinstal langsung (mis. untuk GitHub Release).

> **Tips optimasi:** karena `production` menghasilkan AAB, pastikan `jsEngine: "hermes"` dan `enableProguardInReleaseBuilds: true` di `app.json` tetap aktif — keduanya diterapkan untuk semua profil build rilis, tidak hanya `github-release`.

## Kontribusi

Pull request dipersilakan. Untuk perubahan besar, silakan buka issue terlebih dahulu untuk mendiskusikan apa yang ingin diubah.

## Lisensi

[MIT](LICENSE)