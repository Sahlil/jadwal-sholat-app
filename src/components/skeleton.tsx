import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  /** Warna dasar blok skeleton; default `colors.border`. */
  baseColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Blok skeleton dengan efek shimmer (cahaya bergelombang) berbasis Reanimated.
 */
export function Skeleton({
  width = "100%",
  height = 14,
  borderRadius = 8,
  baseColor,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-screenWidth, screenWidth]) }],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor ?? colors.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.highlight,
          { width: screenWidth * 0.5, backgroundColor: colors.onPrimary },
          highlightStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.12,
  },
});
