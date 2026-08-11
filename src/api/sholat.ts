import { apiGet } from "@/api/client";
import type { JadwalResponse, KabKota } from "@/types/sholat";

/** Daftar seluruh kabupaten/kota di Indonesia. */
export const getAllKabKota = () => apiGet<KabKota[]>("/sholat/kabkota/semua");

/** Pencarian kabupaten/kota berdasarkan kata kunci. */
export const searchKabKota = (keyword: string) =>
  apiGet<KabKota[]>(`/sholat/kabkota/cari/${encodeURIComponent(keyword)}`);

/** Jadwal sholat hari ini untuk satu kabupaten/kota. */
export const getJadwalToday = (id: string) =>
  apiGet<JadwalResponse>(`/sholat/jadwal/${id}/today`);

/**
 * Jadwal sholat untuk satu periode.
 * `period` berupa "YYYY-MM" (sebulan) atau "YYYY-MM-DD" (satu hari).
 */
export const getJadwalPeriod = (id: string, period: string) =>
  apiGet<JadwalResponse>(`/sholat/jadwal/${id}/${period}`);
