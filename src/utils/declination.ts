import DECLINATION_GRID from "@/data/declination-grid.json";

const STEP = DECLINATION_GRID.step;
const LAT_MIN = -85;
const LON_MIN = -180;
const COLS = 360 / STEP + 1; // lon dari -180..180
const ROWS = 170 / STEP + 1; // lat dari -85..85

const values = DECLINATION_GRID.points.map((p) => p.d);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Deklinasi magnetik (derajat, timur = positif) via interpolasi bilinear
 * dari grid. Dipakai untuk mengonversi heading magnetik ke heading sebenarnya.
 */
export function declination(lat: number, lon: number): number {
  const latF = (lat - LAT_MIN) / STEP;
  const lonF = (lon - LON_MIN) / STEP;

  const i0 = Math.floor(latF);
  const j0 = Math.floor(lonF);
  const i1 = i0 + 1;
  const j1 = j0 + 1;

  const fi = latF - i0;
  const fj = lonF - j0;

  const at = (i: number, j: number) =>
    values[clamp(i, 0, ROWS - 1) * COLS + clamp(j, 0, COLS - 1)];

  const v00 = at(i0, j0);
  const v10 = at(i1, j0);
  const v01 = at(i0, j1);
  const v11 = at(i1, j1);

  const top = v00 * (1 - fi) + v10 * fi;
  const bottom = v01 * (1 - fi) + v11 * fi;
  return top * (1 - fj) + bottom * fj;
}
