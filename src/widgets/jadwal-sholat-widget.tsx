'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { PrayerKey } from '@/types/sholat';

export const WIDGET_NAME = 'JadwalSholat';

export interface JadwalSholatWidgetProps {
  cityName: string;
  tanggal: string;
  times: Record<PrayerKey, string>;
}

/** Hanya 5 waktu sholat wajib untuk format pita horizontal. */
const PRAYERS: { label: string; key: PrayerKey }[] = [
  { label: 'Subuh', key: 'subuh' },
  { label: 'Dzuhur', key: 'dzuhur' },
  { label: 'Ashar', key: 'ashar' },
  { label: 'Maghrib', key: 'maghrib' },
  { label: 'Isya', key: 'isya' },
];

function PrayerCell({ label, time }: { label: string; time: string }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget text={label} style={{ color: '#A7F3D0', fontSize: 11, fontWeight: '600' }} />
      <TextWidget text={time} style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }} />
    </FlexWidget>
  );
}

export function JadwalSholatWidget({ cityName, tanggal, times }: JadwalSholatWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`Jadwal sholat hari ini untuk ${cityName}. Ketuk untuk membuka aplikasi.`}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundGradient: { from: '#0F766E', to: '#115E59', orientation: 'TOP_BOTTOM' },
        borderRadius: 18,
        padding: 10,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: 72,
          marginRight: 4,
        }}
      >
        <TextWidget
          text={cityName}
          truncate="END"
          maxLines={1}
          style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', textAlign: 'left' }}
        />
        <TextWidget
          text={tanggal}
          truncate="END"
          maxLines={1}
          style={{ color: '#A7F3D0', fontSize: 9, textAlign: 'left' }}
        />
      </FlexWidget>

      {PRAYERS.map(({ label, key }) => (
        <PrayerCell key={key} label={label} time={times[key]} />
      ))}
    </FlexWidget>
  );
}