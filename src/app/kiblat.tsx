import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { LoadingView } from "@/components/loading-view";
import { ErrorView } from "@/components/error-view";
import { Colors } from "@/constants/theme";
import { useQibla } from "@/hooks/use-qibla";

const DIRECTION_NAMES = [
  "Utara",
  "Timur Laut",
  "Timur",
  "Tenggara",
  "Selatan",
  "Barat Daya",
  "Barat",
  "Barat Laut",
];

function directionName(bearing: number): string {
  return DIRECTION_NAMES[Math.round(bearing / 45) % 8];
}

function CompassDial({
  needleRotation,
  calibrationLow,
}: {
  needleRotation: ReturnType<typeof useQibla>["needleRotation"];
  calibrationLow: boolean;
}) {
  const blink = useSharedValue(1);

  useEffect(() => {
    if (calibrationLow) {
      blink.value = withRepeat(withTiming(0.2, { duration: 600 }), -1, true);
    } else {
      blink.value = 1;
    }
  }, [calibrationLow, blink]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleRotation.value}deg` }],
  }));

  const warningStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View style={styles.compassWrap}>
      <View style={styles.dial}>
        <Text style={[styles.cardinal, styles.north]}>U</Text>
        <Text style={[styles.cardinal, styles.east]}>T</Text>
        <Text style={[styles.cardinal, styles.south]}>S</Text>
        <Text style={[styles.cardinal, styles.west]}>B</Text>

        <Animated.View style={[styles.needle, needleStyle]}>
          <View style={styles.needleTip} />
          <View style={styles.needleShaft} />
        </Animated.View>

        <View style={styles.centerDot} />
      </View>

      {calibrationLow ? (
        <Animated.View style={[styles.warning, warningStyle]}>
          <Text style={styles.warningText}>
            Kalibrasi rendah — gerakkan perangkat membentuk angka 8 (∞) di udara.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function KiblatScreen() {
  const { status, error, qiblaBearing, heading, location, needleRotation, calibrationOk } =
    useQibla();

  const [calibrationLow, setCalibrationLow] = useState(false);

  useAnimatedReaction(
    () => calibrationOk.value,
    (ok) => setCalibrationLow(ok === 0),
    [calibrationOk],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Arah Kiblat" }} />

      {status === "loading" ? (
        <LoadingView message="Menyiapkan sensor & lokasi..." />
      ) : status === "error" ? (
        <ErrorView message={error ?? "Tidak dapat memuat arah kiblat."} />
      ) : (
        <View style={styles.content}>
          <CompassDial needleRotation={needleRotation} calibrationLow={calibrationLow} />

          <View style={styles.info}>
            <Text style={styles.bearing}>{Math.round(qiblaBearing)}°</Text>
            <Text style={styles.direction}>{directionName(qiblaBearing)}</Text>
            <Text style={styles.heading}>Perangkat menghadap {Math.round(heading)}°</Text>
            {location ? <Text style={styles.location}>{location.label}</Text> : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  compassWrap: {
    alignItems: "center",
    gap: 16,
  },
  dial: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 12,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardinal: {
    position: "absolute",
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  north: { top: 10 },
  south: { bottom: 10 },
  east: { right: 14 },
  west: { left: 14 },
  needle: {
    width: 0,
    height: 190,
    alignItems: "center",
  },
  needleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 30,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.accent,
  },
  needleShaft: {
    width: 6,
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  centerDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  warning: {
    maxWidth: 260,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  warningText: {
    color: "#92400E",
    fontSize: 12,
    textAlign: "center",
  },
  info: {
    alignItems: "center",
    gap: 4,
  },
  bearing: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
  },
  direction: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  heading: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
