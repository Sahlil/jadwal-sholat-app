'use no memo';

import React from 'react';
import type { WidgetRepresentation, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getJadwalToday } from '@/api/sholat';
import { getHijriByDate } from '@/api/hijri';
import { DEFAULT_CITY } from '@/hooks/use-selected-city';
import {
  getCachedHijriToday,
  getCachedJadwalToday,
  saveCachedHijriToday,
  saveCachedJadwalToday,
} from '@/storage/cache';
import { getSelectedCity } from '@/storage/city';
import { toDateKey } from '@/utils/date';
import { formatHijri } from '@/utils/hijri';
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
 * Mengambil tanggal hijriyah hari ini (network, fallback cache AsyncStorage).
 * Gagal total → null; widget tetap render tanpa hijri.
 */
async function loadHijriToday(): Promise<string> {
  const dateKey = toDateKey(new Date());
  try {
    const fresh = await getHijriByDate(new Date());
    await saveCachedHijriToday(dateKey, fresh);
    return formatHijri(fresh);
  } catch {
    const cached = await getCachedHijriToday(dateKey);
    return cached?.data ? formatHijri(cached.data) : '';
  }
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
    const hijri = await loadHijriToday();

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
