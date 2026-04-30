import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

const HOLD_MS = 600;
const FADE_MS = 450;

export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDone();
      });
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [onDone, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, { opacity, transform: [{ scale }] }]}
    >
      <Image
        source={require("../assets/splash-icon.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navyDeep,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
