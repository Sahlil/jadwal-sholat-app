import type { AladhanResponse } from "@/types/hijri";
import type { ApiResponse } from "@/types/sholat";

const MYQURAN_URL = "https://api.myquran.com/v3";
const ALADHAN_URL = "https://api.aladhan.com/v1";
const TIMEOUT_MS = 15000;

export class ApiError extends Error {}

async function fetchJson<T>(url: string, unwrap: (body: unknown) => T): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`Server merespons dengan status ${response.status}`);
    }

    return unwrap(await response.json());
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Koneksi timeout. Periksa internet Anda lalu coba lagi.");
    }

    throw new ApiError("Terjadi kesalahan jaringan. Pastikan internet Anda aktif.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return fetchJson(`${MYQURAN_URL}${path}`, (body) => {
    const { status, message, data } = body as ApiResponse<T>;
    if (!status) throw new ApiError(message || "Data tidak ditemukan.");
    return data;
  });
}

export async function apiGetAladhan<T>(path: string): Promise<T> {
  return fetchJson(`${ALADHAN_URL}${path}`, (body) => {
    const { code, status, data } = body as AladhanResponse<T>;
    if (code !== 200 || status !== "OK") throw new ApiError("Data tidak ditemukan.");
    return data;
  });
}
