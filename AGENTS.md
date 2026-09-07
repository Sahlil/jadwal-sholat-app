# AGENTS.md — Panduan untuk AI Coding Agent

Panduan ini meringkas aturan kerja untuk proyek **ayo sholat** (aplikasi jadwal sholat Expo / React Native). Baca sebelum menulis kode.

## 1. Expo HAS CHANGED

Baca dokumen versi persis di https://docs.expo.dev/versions/v57.0.0/ sebelum menulis kode apa pun. Jangan mengasumsikan API versi SDK lain.

## 2. Perintah

```bash
npm run lint          # ESLint (eslint-config-expo)
npm run typecheck     # tsc --noEmit (strict)
npm run check         # lint + typecheck
npx expo start --dev-client   # jalankan Metro untuk dev client
```

- `npm run check` **wajib lulus tanpa error** sebelum tugas dinyatakan selesai.
- Jalankan dengan `--dev-client`, **bukan Expo Go**.
- Generator data deterministik (jalankan ulang setelah mengubah script-nya):
  ```bash
  node scripts/generate-city-coordinates.mjs   # regenerasi src/data/city-coordinates.json
  node scripts/generate-declination-grid.mjs   # regenerasi src/data/declination-grid.json
  ```

## 3. Batasan Kritis

- **Custom development build, bukan Expo Go.** Proyek memuat modul native: `react-native-android-widget`, `expo-location`, `expo-notifications`, `expo-sqlite`. Setiap kali menambah/mengubah modul native, dev build harus dibangun ulang: `eas build -p android --profile development`.
- **File di `src/data/*.json` adalah hasil generator** (`scripts/*.mjs`). Jangan edit manual — ubah generatornya lalu regenerate.
- **Komponen widget** (`src/widgets/*-widget.tsx`) wajib diawali `'use no memo'` di baris pertama karena project mengaktifkan React Compiler.
- **Kode sensor kiblat** harus berupa worklet reanimated (dieksekusi di UI thread via `useAnimatedSensor`). Jangan memindahkan komputasi sensor ke JS thread atau menyentuh scope JS non-serializable dari dalam worklet.
- **Offline-first:** layar beranda & jadwal bulanan membaca dari SQLite terlebih dahulu, lalu refresh dari API di background. Jangan membalik alur ini atau membuat layar baru yang fetch-first ke jaringan.
- **Retensi LRU SQLite:** maksimum `CITY_CACHE_CAP = 5` kota. Jangan diubah sembarang; tabel di-key `city_id`.
- **Pengingat sholat** memakai trigger `DATE` untuk window 30 hari (`REMINDER_WINDOW_DAYS`) yang disinkronkan ulang tiap aplikasi dibuka — **jangan** diganti trigger `DAILY` (rawan drift).

## 4. Peta Arsitektur

Alur berlapis satu arah:

```
api/  →  services/  →  storage/  →  hooks/  →  app/
```

| Folder | Isi | Catatan |
| --- | --- | --- |
| `src/api/` | `client.ts` (fetch + timeout + error terpusat), `sholat.ts` (endpoint myQuran tipe-aman) | Semua network call lewat sini |
| `src/services/` | `offline.ts` (sinkron tahunan → SQLite), `reminders.ts` (notifikasi) | Logika bisnis, tanpa UI |
| `src/storage/` | AsyncStorage: `city.ts`, `reminders.ts`, `cache.ts`; SQLite: `db.ts`, `schedule-repo.ts` | Satu-satunya lapisan yang menyentuh persistensi |
| `src/hooks/` | `use-api`, `use-selected-city`, `use-location-city`, `use-schedule`, `use-qibla` | State & logika per fitur |
| `src/app/` | Screen Expo Router: `_layout`, `index`, `kota`, `jadwal`, `pengingat`, `kiblat` | UI tipis, panggil hooks |
| `src/widgets/` | Komponen widget Android + task handler background | Lihat batasan `'use no memo'` |
| `src/utils/` | `date.ts`, `qibla.ts` (worklet), `declination.ts` | Fungsi murni, mudah diuji |
| `src/data/` | JSON hasil generator (koordinat kota, grid deklinasi) | Jangan edit manual |
| `scripts/` | Generator data `.mjs` | Node ≥ 22 |

## 5. Konvensi

- TypeScript **strict**; path alias `@/*` → `./src/*` dan `@/assets/*` → `./assets/*` (lihat `tsconfig.json`).
- Error API ditangani terpusat di `src/api/client.ts` (timeout, status HTTP, respon `status: false`) — jangan duplikasi try/catch per pemanggil.
- Teks UI dalam **bahasa Indonesia**.
- Nama file **kebab-case**; ikuti pola folder existing saat menambah file.
- Tidak menambah komentar kecuali diminta.
- Konfigurasi Expo: statis di `app.json`, dinamis (optimasi ABI profil release) di `app.config.js`. Izin native (lokasi, exact alarm) dikonfigurasi via config plugin di `app.json`.

## 6. Profil Build (eas.json)

| Profil | Output | Tujuan |
| --- | --- | --- |
| `development` | APK dev client | Pengembangan harian |
| `preview` | APK internal | Uji rilis di perangkat |
| `github-release` | APK arm64-v8a (dioptimalkan via `app.config.js`) | Lampiran GitHub Release |
| `production` | AAB (`autoIncrement`) | Upload Google Play |

Optimasi ukuran (`buildArchs: ["arm64-v8a"]`, minify, dsb.) hanya aktif untuk profil `github-release` & `preview`.

## 7. Verifikasi

- Belum ada test suite otomatis. Verifikasi minimal: `npm run check`.
- Untuk perubahan fitur native (widget, notifikasi, GPS, SQLite, sensor), uji manual di dev client di perangkat/emulator Android — tidak bisa diverifikasi dari web/desktop.
