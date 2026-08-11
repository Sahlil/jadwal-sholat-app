import type { ApiResponse } from "@/types/sholat";

const BASE_URL = "https://api.myquran.com/v3";
const TIMEOUT_MS = 15000;

export class ApiError extends Error {}

export async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`Server merespons dengan status ${response.status}`);
    }

    const body = (await response.json()) as ApiResponse<T>;

    if (!body.status) {
      throw new ApiError(body.message || "Data tidak ditemukan.");
    }

    return body.data;
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
