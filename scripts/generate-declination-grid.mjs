// Bangkitkan src/data/declination-grid.json dari model dipole geomagnetik.
// Menghasilkan grid dunia setiap STEP derajat. Deterministis — tidak butuh
// data runtime; deklinasi timur = positif.
//
// Rumus declination (centered dipole):
//   D = atan2( sin(Δλ), cos(φ)·tan(φp) − sin(φ)·cos(Δλ) )
//   Δλ = λ − λp ; φ = lintang ; φp = lintang kutub magnetik ; λp = bujur kutub magnetik
//
// Jalankan: node scripts/generate-declination-grid.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Perkiraan posisi kutub magnetik utara (epoch WMM2020).
const MAGNETIC_POLE_LAT = 80.65; // °N
const MAGNETIC_POLE_LON = -72.68; // °E

const STEP = 5; // derajat antar sampel grid
const LAT_MIN = -85;
const LAT_MAX = 85;
const LON_MIN = -180;
const LON_MAX = 180;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Deklinasi magnetik (derajat, timur = positif) untuk koordinat tertentu. */
function dipoleDeclination(lat, lon) {
  const phi = toRad(lat);
  const dLambda = toRad(lon - MAGNETIC_POLE_LON);
  const phiP = toRad(MAGNETIC_POLE_LAT);
  const y = Math.sin(dLambda);
  const x = Math.cos(phi) * Math.tan(phiP) - Math.sin(phi) * Math.cos(dLambda);
  return toDeg(Math.atan2(y, x));
}

function buildGrid() {
  const points = [];
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
    for (let lon = LON_MIN; lon <= LON_MAX; lon += STEP) {
      points.push({ lat, lon, d: Number(dipoleDeclination(lat, lon).toFixed(2)) });
    }
  }
  return points;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const outPath = join(outDir, "declination-grid.json");
const grid = buildGrid();
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify({ step: STEP, points: grid }));

console.log(`Ditulis ${outPath} (${grid.length} titik grid).`);