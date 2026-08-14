#!/usr/bin/env node
/**
 * Membuat src/data/city-coordinates.json — tabel koordinat kabupaten/kota
 * yang dipakai untuk deteksi lokasi (GPS -> kota terdekat).
 *
 * Sumber:
 *  - Daftar kota + ID : https://api.myquran.com/v3/sholat/kabkota/semua
 *  - Koordinat        : https://github.com/yusufsyaifudin/wilayah-indonesia
 *                       (data/list_of_area/regencies.json)
 *
 * Jalankan: node scripts/generate-city-coordinates.mjs
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src/data/city-coordinates.json");

const MYQURAN_URL = "https://api.myquran.com/v3/sholat/kabkota/semua";
const REGENCIES_URL =
  "https://raw.githubusercontent.com/yusufsyaifudin/wilayah-indonesia/master/data/list_of_area/regencies.json";

/** Koordinat manual untuk kota yang tidak ada / beda nama di dataset sumber. */
const MANUAL = {
  "PULAU TAMBELAN KAB. BINTAN": [0.98333, 107.55],
  "PEKAJANG KAB. LINGGA": [-1.2, 105.26667],
  "PULAU SERASAN KAB. NATUNA": [2.5, 109.01667],
  "PULAU MIDAI KAB. NATUNA": [3.0, 107.78333],
  "PULAU LAUT KAB. NATUNA": [4.68333, 107.93333],
  "KOTA JAKARTA": [-6.20876, 106.8456],
  "KAB. MAHAKAM ULU": [0.5, 115.28],
  "KAB. PAHUWATO": [0.7098, 121.59582],
  "KAB. KEPULAUAN SIAU TAGULANDANG BIARO": [2.35, 125.42],
  "KOTA SOFIFI": [0.72444, 127.58056],
  "KAB. YAPEN WAROPEN": [-1.8785, 136.2393],
};

/** "KAB. ACEH BARAT" -> "kabupatenacehbarat" */
function normalize(name) {
  return name
    .replace("KAB.", "KABUPATEN")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil ${url} (status ${res.status})`);
  return res.json();
}

async function main() {
  const myquran = (await fetchJson(MYQURAN_URL)).data;
  const regencies = await fetchJson(REGENCIES_URL);

  const regencyByNorm = new Map();
  for (const reg of regencies) {
    regencyByNorm.set(normalize(reg.name), reg);
  }

  const rows = [];
  const manualUsed = [];
  const missing = [];

  for (const city of myquran) {
    const reg = regencyByNorm.get(normalize(city.lokasi));
    let lat, lon;

    if (reg) {
      lat = Number(reg.latitude);
      lon = Number(reg.longitude);
    } else if (MANUAL[city.lokasi]) {
      [lat, lon] = MANUAL[city.lokasi];
      manualUsed.push(city.lokasi);
    } else {
      missing.push(city.lokasi);
      continue;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      missing.push(`${city.lokasi} (koordinat tidak valid: ${reg?.latitude}, ${reg?.longitude})`);
      continue;
    }

    rows.push({ id: city.id, lokasi: city.lokasi, lat, lon });
  }

  if (missing.length > 0) {
    console.warn(`⚠ ${missing.length} kota tanpa koordinat (dilewati):`);
    for (const m of missing) console.warn(`  - ${m}`);
  }

  rows.sort((a, b) => a.lokasi.localeCompare(b.lokasi));
  await writeFile(OUTPUT, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

  console.log(`✓ ${rows.length} kota ditulis ke ${OUTPUT}`);
  console.log(`  (${myquran.length - rows.length - missing.length + manualUsed.length} manual: ${manualUsed.join(", ")})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
