'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { PrayerKey } from '@/types/sholat';

export const WIDGET_NAME = 'JadwalSholat';

export interface JadwalSholatWidgetProps {
  cityName: string;
  tanggal: string;
  hijri?: string;
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
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget text={label} style={{ color: '#A7F3D0', fontSize: 11, fontWeight: '600' }} />
      <TextWidget text={time} style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} />
    </FlexWidget>
  );
}

/** Buang nama hari dari "Selasa, 25/08/2026" -> "25/08/2026". */
const masehiOnly = (tanggal: string) => tanggal.split(', ').pop() ?? tanggal;

export function JadwalSholatWidget({ cityName, tanggal, hijri, times }: JadwalSholatWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`Jadwal sholat hari ini untuk ${cityName}. Ketuk untuk membuka aplikasi.`}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundGradient: { from: '#0F766E', to: '#115E59', orientation: 'TOP_BOTTOM' },
        borderRadius: 18,
        padding: 14,
      }}
    >
      <TextWidget
        text={cityName}
        truncate="END"
        maxLines={1}
        style={{
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: '700',
          textAlign: 'center',
          width: 'match_parent',
        }}
      />
      <TextWidget
        text={hijri ? `${hijri} | ${masehiOnly(tanggal)}` : masehiOnly(tanggal)}
        truncate="END"
        maxLines={1}
        style={{
          color: '#A7F3D0',
          fontSize: 11,
          textAlign: 'center',
          width: 'match_parent',
          marginTop: 2,
        }}
      />

      <FlexWidget
        style={{
          width: 'match_parent',
          height: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          marginVertical: 10,
        }}
      />

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {PRAYERS.map(({ label, key }) => (
          <PrayerCell key={key} label={label} time={times[key]} />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
