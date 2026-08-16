/** Koordinat Kaaba (Makkah). */
export const KAABA_LAT = 21.422525;
export const KAABA_LON = 39.826181;

/** Rentang kekuatan medan magnet Bumi yang wajar (µT) untuk heuristik kalibrasi. */
export const MAGNETIC_SANE_MIN = 20;
export const MAGNETIC_SANE_MAX = 70;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/** Initial bearing (derajat, 0–360) dari titik 1 menuju titik 2. */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  "worklet";
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return normalize(toDeg(Math.atan2(y, x)));
}

/** Arah Kiblat (derajat, 0–360) dari koordinat pengguna. */
export function qiblaBearingFor(lat: number, lon: number): number {
  "worklet";
  return bearing(lat, lon, KAABA_LAT, KAABA_LON);
}

/**
 * Heading magnetik perangkat (derajat, 0–360) dengan kompensasi kemiringan
 * memakai vektor gravitasi dari accelerometer. Worklet-compatible.
 */
export function headingFromSensors(
  magX: number,
  magY: number,
  magZ: number,
  gX: number,
  gY: number,
  gZ: number,
): number {
  "worklet";
  const roll = Math.atan2(gY, gZ);
  const pitch = Math.atan2(-gX, Math.sqrt(gY * gY + gZ * gZ));

  const xh = magX * Math.cos(pitch) + magZ * Math.sin(pitch);
  const yh =
    magX * Math.sin(roll) * Math.sin(pitch) +
    magY * Math.cos(roll) -
    magZ * Math.sin(roll) * Math.cos(pitch);

  return normalize(toDeg(Math.atan2(yh, xh)));
}

/**
 * Rotasi jarum kompas (derajat) agar menunjuk arah Kiblat, mengingat heading
 * magnetik perangkat dan koreksi deklinasi.
 */
export function needleRotation(qiblaBearing: number, magneticHeading: number, declinationDeg: number): number {
  "worklet";
  const trueHeading = normalize(magneticHeading + declinationDeg);
  return normalize(qiblaBearing - trueHeading);
}

/**
 * Heuristik kalibrasi magnetometer: tandai tidak waras bila kekuatan medan
 * menyimpang jauh dari rentang medan magnet Bumi (gangguan elektromagnetik /
 * miscalibration). Mengembalikan `false` saat dianggap tidak kalibrasi.
 */
export function isMagneticSane(magX: number, magY: number, magZ: number): boolean {
  "worklet";
  const magnitude = Math.sqrt(magX * magX + magY * magY + magZ * magZ);
  return magnitude >= MAGNETIC_SANE_MIN && magnitude <= MAGNETIC_SANE_MAX;
}
