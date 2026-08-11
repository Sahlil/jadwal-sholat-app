'use no memo';

import React from 'react';
import type { WidgetRepresentation, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getJadwalToday } from '@/api/sholat';
import { DEFAULT_CITY } from '@/hooks/use-selected-city';
import { getSelectedCity } from '@/storage/city';
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
 * Mengambil kota terpilih + jadwal hari ini, lalu merender widget.
 * Jika gagal (offline, dsb.), tetap render placeholder agar widget tidak blank.
 */
async function renderWithFreshData(
  renderWidget: (widget: WidgetRepresentation) => void,
) {
  try {
    const city = await getSelectedCity();
    const response = await getJadwalToday(city?.id ?? DEFAULT_CITY.id);
    const jadwal = Object.values(response.jadwal)[0];

    renderWidget(
      <JadwalSholatWidget
        cityName={city?.lokasi ?? DEFAULT_CITY.lokasi}
        tanggal={jadwal?.tanggal ?? ''}
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
