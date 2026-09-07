'use no memo';

import React from 'react';
import type { WidgetRepresentation, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getJadwalToday } from '@/api/sholat';
import { getHijriByDate } from '@/api/hijri';
import { DEFAULT_CITY } from '@/hooks/use-selected-city';
import {
  getCachedHijriToday,
  getCachedHijriTodayAdjusted,
  getCachedJadwalToday,
  saveCachedHijriToday,
  saveCachedHijriTodayAdjusted,
  saveCachedJadwalToday,
} from '@/storage/cache';
import { getSelectedCity } from '@/storage/city';
import { toDateKey } from '@/utils/date';
import { adjustHijriByMaghrib, formatHijri } from '@/utils/hijri';
import type { HijriDate } from '@/types/hijri';
import { JadwalSholatWidget, WIDGET_NAME } from '@/widgets/jadwal-sholat-widget';

const nameToWidget = {
  [WIDGET_NAME]: JadwalSholatWidget,
} as const;

type WidgetName = keyof typeof nameToWidget;

const EMPTY_TIMES = {
  imsak: '--:--',
  subuh: '--:--',
  terbit: '--:--',
  dhuha: '--:--',
  dzuhur: '--:--',
  ashar: '--:--',
  maghrib: '--:--',
  isya: '--:--',
};

/**
 * Mengambil tanggal hijriyah hari ini yang sudah disesuaikan Maghrib.
 * - Cache base hijri per tanggal (global)
 * - Cache adjusted hijri per kota+tanggal (karena maghrib beda per lokasi)
 * - Fallback ke cache adjusted, lalu base hijri + maghrib dari cache jadwal
 */
async function loadHijriTodayAdjusted(cityId: string): Promise<string> {
  const dateKey = toDateKey(new Date());

  // 1) Coba ambil adjusted dari cache (per kota)
  const cachedAdjusted = await getCachedHijriTodayAdjusted(cityId, dateKey);
  if (cachedAdjusted?.data) {
    return formatHijri(cachedAdjusted.data);
  }

  // 2) Ambil base hijri (cache atau API)
  let baseHijri: HijriDate | null = null;
  const cachedBase = await getCachedHijriToday(dateKey);
  if (cachedBase?.data) {
    baseHijri = cachedBase.data;
  } else {
    try {
      const fresh = await getHijriByDate(new Date());
      await saveCachedHijriToday(dateKey, fresh);
      baseHijri = fresh;
    } catch {
      // Base gagal, coba cache base
      if (!cachedBase?.data) return '';
      baseHijri = cachedBase.data;
    }
  }

  if (!baseHijri) return '';

  // 3) Ambil maghrib dari jadwal lokal (cache)
  const cachedJadwal = await getCachedJadwalToday(cityId);
  const maghribTime = cachedJadwal?.data?.jadwal
    ? Object.values(cachedJadwal.data.jadwal)[0]?.maghrib
    : undefined;

  // 4) Adjust dan simpan adjusted cache
  const adjusted = maghribTime
    ? adjustHijriByMaghrib(baseHijri, maghribTime, new Date())
    : baseHijri;
  await saveCachedHijriTodayAdjusted(cityId, dateKey, adjusted);
  return formatHijri(adjusted);
}

/**
 * Mengambil kota terpilih + jadwal hari ini, lalu merender widget.
 * Jika gagal (offline, dsb.), tetap render placeholder agar widget tidak blank.
 */
async function renderWithFreshData(
  renderWidget: (widget: WidgetRepresentation) => void,
) {
  try {
    const city = await getSelectedCity();
    const cityId = city?.id ?? DEFAULT_CITY.id;
    const cityName = city?.lokasi ?? DEFAULT_CITY.lokasi;
    let response;

    try {
      response = await getJadwalToday(cityId);
      await saveCachedJadwalToday(cityId, response);
    } catch (err) {
      const cached = await getCachedJadwalToday(cityId);
      if (!cached) throw err;
      response = cached.data;
    }

    const jadwal = Object.values(response.jadwal)[0];
    const hijri = await loadHijriTodayAdjusted(cityId);

    renderWidget(
      <JadwalSholatWidget
        cityName={cityName}
        tanggal={jadwal?.tanggal ?? ''}
        hijri={hijri}
        times={jadwal ?? EMPTY_TIMES}
      />,
    );
  } catch {
    renderWidget(
      <JadwalSholatWidget cityName="Jadwal Sholat" tanggal="" times={EMPTY_TIMES} />,
    );
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as WidgetName];

  if (!Widget) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      await renderWithFreshData(props.renderWidget);
      break;
    case 'WIDGET_RESIZED':
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
    default:
      break;
  }
}
