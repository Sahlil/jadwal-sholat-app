import { useEffect, useState } from "react";
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import * as Location from "expo-location";

import CITY_COORDS from "@/data/city-coordinates.json";
import { useSelectedCity } from "@/hooks/use-selected-city";
import { declination } from "@/utils/declination";
import {
  headingFromSensors,
  isMagneticSane,
  needleRotation,
  qiblaBearingFor,
} from "@/utils/qibla";

const normalize = (deg: number): number => {
  "worklet";
  return ((deg % 360) + 360) % 360;
};

export type QiblaStatus = "loading" | "ready" | "error";

export interface QiblaLocation {
  lat: number;
  lon: number;
  label: string;
}

export interface UseQiblaResult {
  status: QiblaStatus;
  error: string | null;
  qiblaBearing: number;
  heading: number;
  location: QiblaLocation | null;
  /** Shared value rotasi jarum (derajat) — konsumsi via useAnimatedStyle. */
  needleRotation: SharedValue<number>;
  /** Shared value 1 = kalibrasi baik, 0 = buruk. */
  calibrationOk: SharedValue<number>;
}

/** Koordinat kota aktif dari tabel lokal (fallback bila GPS tak tersedia). */
function cityCoords(cityId: string): QiblaLocation | null {
  const city = CITY_COORDS.find((c) => c.id === cityId);
  if (!city) return null;
  return { lat: city.lat, lon: city.lon, label: city.lokasi };
}

export function useQibla(): UseQiblaResult {
  const city = useSelectedCity();
  const [status, setStatus] = useState<QiblaStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState<QiblaLocation | null>(null);

  const bearingRef = useSharedValue(0);
  const declinationRef = useSharedValue(0);

  const mag = useAnimatedSensor(SensorType.MAGNETIC_FIELD, {
    interval: 100,
    adjustToInterfaceOrientation: true,
  });
  const grav = useAnimatedSensor(SensorType.GRAVITY, {
    interval: 100,
    adjustToInterfaceOrientation: true,
  });

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(async () => {
        if (!mag.isAvailable || !grav.isAvailable) {
          throw new Error("Sensor magnetometer/gravitasi tidak tersedia di perangkat ini.");
        }
        // GPS dulu bila diizinkan, fallback koordinat kota aktif.
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          return {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: "Lokasi saat ini",
          } satisfies QiblaLocation;
        }
        if (city) {
          const coords = cityCoords(city.id);
          if (coords) return coords;
        }
        throw new Error("Lokasi tidak tersedia.");
      })
      .then((loc) => {
        if (!active) return;
        const bearing = qiblaBearingFor(loc.lat, loc.lon);
        const decl = declination(loc.lat, loc.lon);
        bearingRef.value = bearing;
        declinationRef.value = decl;
        setQiblaBearing(bearing);
        setLocation(loc);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      active = false;
      mag.unregister();
      grav.unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.id]);

  const needleRotationValue = useDerivedValue(() => {
    const m = mag.sensor.value;
    const g = grav.sensor.value;
    const headingDeg = headingFromSensors(m.x, m.y, m.z, g.x, g.y, g.z);
    return needleRotation(bearingRef.value, headingDeg, declinationRef.value);
  });

  const calibrationOkValue = useDerivedValue<number>(() => {
    const m = mag.sensor.value;
    return isMagneticSane(m.x, m.y, m.z) ? 1 : 0;
  });

  useAnimatedReaction(
    () => needleRotationValue.value,
    (rotation) => {
      const newHeading = normalize(qiblaBearing - rotation);
      runOnJS(setHeading)(newHeading);
    },
    [qiblaBearing],
  );

  return {
    status,
    error,
    qiblaBearing,
    heading,
    location,
    needleRotation: needleRotationValue,
    calibrationOk: calibrationOkValue,
  };
}
