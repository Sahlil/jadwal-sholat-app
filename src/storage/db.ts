import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "jadwal-sholat.db";
const DATABASE_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Buka (sekali) dan migrasi database. */
export function openDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = init();
  }
  return dbPromise;
}

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  await db.execAsync("PRAGMA journal_mode = WAL");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cities (
      city_id TEXT PRIMARY KEY NOT NULL,
      kabko TEXT NOT NULL,
      prov TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jadwal (
      city_id TEXT NOT NULL,
      date_key TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      imsak TEXT,
      subuh TEXT,
      terbit TEXT,
      dhuha TEXT,
      dzuhur TEXT,
      ashar TEXT,
      maghrib TEXT,
      isya TEXT,
      PRIMARY KEY (city_id, date_key)
    );
    CREATE INDEX IF NOT EXISTS idx_jadwal_city ON jadwal(city_id);

    CREATE TABLE IF NOT EXISTS month_meta (
      city_id TEXT NOT NULL,
      month_key TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (city_id, month_key)
    );
  `);

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
