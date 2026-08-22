import type { JadwalResponse, JadwalSholat, KabKota } from "@/types/sholat";
import { openDb } from "@/storage/db";

const nowIso = () => new Date().toISOString();

// SQLite transactions must not overlap: expo-sqlite may otherwise report a locked database.
let writeChain: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task);
  writeChain = run.catch(() => {});
  return run;
}

interface JadwalRow {
  city_id: string;
  date_key: string;
  tanggal: string;
  imsak: string | null;
  subuh: string | null;
  terbit: string | null;
  dhuha: string | null;
  dzuhur: string | null;
  ashar: string | null;
  maghrib: string | null;
  isya: string | null;
}

interface CityRow {
  city_id: string;
  kabko: string;
  prov: string;
}

function toJadwalSholat(row: JadwalRow): JadwalSholat {
  return {
    tanggal: row.tanggal,
    imsak: row.imsak ?? "",
    subuh: row.subuh ?? "",
    terbit: row.terbit ?? "",
    dhuha: row.dhuha ?? "",
    dzuhur: row.dzuhur ?? "",
    ashar: row.ashar ?? "",
    maghrib: row.maghrib ?? "",
    isya: row.isya ?? "",
  };
}

/** Catat akses kota (untuk strategi LRU) lalu simpan kabko/prov. */
export async function upsertCity(city: KabKota, kabko: string, prov: string): Promise<void> {
  const db = await openDb();
  await enqueueWrite(() =>
    db.runAsync(
      `INSERT INTO cities (city_id, kabko, prov, last_used_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(city_id) DO UPDATE SET
         kabko = excluded.kabko,
         prov = excluded.prov,
         last_used_at = excluded.last_used_at`,
      city.id,
      kabko,
      prov,
      nowIso(),
    ),
  );
}

/** Tandai kota baru saja digunakan tanpa mengubah kabko/prov. */
export async function touchCity(cityId: string): Promise<void> {
  const db = await openDb();
  await enqueueWrite(() =>
    db.runAsync("UPDATE cities SET last_used_at = ? WHERE city_id = ?", nowIso(), cityId),
  );
}

async function persistSchedule(
  cityId: string,
  res: JadwalResponse,
  monthKey?: string,
): Promise<void> {
  const db = await openDb();

  await enqueueWrite(() =>
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO cities (city_id, kabko, prov, last_used_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(city_id) DO UPDATE SET
           kabko = excluded.kabko,
           prov = excluded.prov,
           last_used_at = excluded.last_used_at`,
        cityId,
        res.kabko,
        res.prov,
        nowIso(),
      );

      for (const [dateKey, jadwal] of Object.entries(res.jadwal)) {
        await db.runAsync(
          `INSERT OR REPLACE INTO jadwal
             (city_id, date_key, tanggal, imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          cityId,
          dateKey,
          jadwal.tanggal,
          jadwal.imsak,
          jadwal.subuh,
          jadwal.terbit,
          jadwal.dhuha,
          jadwal.dzuhur,
          jadwal.ashar,
          jadwal.maghrib,
          jadwal.isya,
        );
      }

      if (monthKey) {
        await db.runAsync(
          `INSERT INTO month_meta (city_id, month_key, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(city_id, month_key) DO UPDATE SET updated_at = excluded.updated_at`,
          cityId,
          monthKey,
          nowIso(),
        );
      }
    }),
  );
}

/** Tulis satu hari tanpa menandai bulan lengkap. */
export async function upsertDay(cityId: string, res: JadwalResponse): Promise<void> {
  await persistSchedule(cityId, res);
}

/** Tulis satu bulan jadwal + meta dalam satu transaksi. */
export async function upsertMonth(cityId: string, res: JadwalResponse): Promise<void> {
  const monthKey = Object.keys(res.jadwal)[0]?.slice(0, 7);
  await persistSchedule(cityId, res, monthKey);
}

/** Jadwal satu hari; null bila belum tersedia di DB. */
export async function getJadwalToday(cityId: string, dateKey: string): Promise<JadwalResponse | null> {
  const db = await openDb();
  const city = await db.getFirstAsync<CityRow>(
    "SELECT city_id, kabko, prov FROM cities WHERE city_id = ?",
    cityId,
  );
  const row = await db.getFirstAsync<JadwalRow>(
    "SELECT * FROM jadwal WHERE city_id = ? AND date_key = ?",
    cityId,
    dateKey,
  );
  if (!city || !row) return null;

  return {
    id: cityId,
    kabko: city.kabko,
    prov: city.prov,
    jadwal: { [dateKey]: toJadwalSholat(row) },
  };
}

/** Jadwal satu bulan; null bila belum tersedia di DB. */
export async function getJadwalPeriod(cityId: string, monthKey: string): Promise<JadwalResponse | null> {
  const db = await openDb();
  const city = await db.getFirstAsync<CityRow>(
    "SELECT city_id, kabko, prov FROM cities WHERE city_id = ?",
    cityId,
  );
  const rows = await db.getAllAsync<JadwalRow>(
    "SELECT * FROM jadwal WHERE city_id = ? AND date_key LIKE ? ORDER BY date_key ASC",
    cityId,
    `${monthKey}%`,
  );
  if (!city || rows.length === 0) return null;

  const jadwal: Record<string, JadwalSholat> = {};
  for (const row of rows) {
    jadwal[row.date_key] = toJadwalSholat(row);
  }

  return { id: cityId, kabko: city.kabko, prov: city.prov, jadwal };
}

/** Jadwal untuk rentang tanggal inklusif, dikembalikan sebagai Map<dateKey, JadwalSholat>. */
export async function getJadwalRange(
  cityId: string,
  startKey: string,
  endKey: string,
): Promise<Map<string, JadwalSholat>> {
  const db = await openDb();
  const rows = await db.getAllAsync<JadwalRow>(
    "SELECT * FROM jadwal WHERE city_id = ? AND date_key >= ? AND date_key <= ? ORDER BY date_key ASC",
    cityId,
    startKey,
    endKey,
  );
  const map = new Map<string, JadwalSholat>();
  for (const row of rows) {
    map.set(row.date_key, toJadwalSholat(row));
  }
  return map;
}

export async function hasCity(cityId: string): Promise<boolean> {
  const db = await openDb();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM cities WHERE city_id = ?",
    cityId,
  );
  return (row?.n ?? 0) > 0;
}

export async function hasMonth(cityId: string, monthKey: string): Promise<boolean> {
  const db = await openDb();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM month_meta WHERE city_id = ? AND month_key = ?",
    cityId,
    monthKey,
  );
  return (row?.n ?? 0) > 0;
}

/** True bila bulan belum ada atau dimuat lebih dari `ttlDays` yang lalu. */
export async function isMonthStale(cityId: string, monthKey: string, ttlDays: number): Promise<boolean> {
  const db = await openDb();
  const row = await db.getFirstAsync<{ updated_at: string }>(
    "SELECT updated_at FROM month_meta WHERE city_id = ? AND month_key = ?",
    cityId,
    monthKey,
  );
  if (!row) return true;
  const ageMs = Date.now() - new Date(row.updated_at).getTime();
  return ageMs > ttlDays * 24 * 60 * 60 * 1000;
}

/**
 * Hapus kota yang paling lama tidak digunakan hingga hanya tersisa `cap`.
 * Kembalikan id kota yang dihapus.
 */
export async function evictCities(cap: number): Promise<string[]> {
  const db = await openDb();
  const rows = await db.getAllAsync<{ city_id: string }>(
    `SELECT city_id FROM cities
     ORDER BY last_used_at DESC
     LIMIT -1 OFFSET ?`,
    cap,
  );
  const toDelete = rows.map((r) => r.city_id);
  if (toDelete.length === 0) return toDelete;

  await enqueueWrite(() =>
    db.withTransactionAsync(async () => {
      for (const cityId of toDelete) {
        await db.runAsync("DELETE FROM cities WHERE city_id = ?", cityId);
        await db.runAsync("DELETE FROM jadwal WHERE city_id = ?", cityId);
        await db.runAsync("DELETE FROM month_meta WHERE city_id = ?", cityId);
      }
    }),
  );

  return toDelete;
}
