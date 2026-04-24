import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
export const WALKTHROUGH_DONE_KEY = "ewm.walkthrough.done";

export function WalkthroughScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const slides = [
    { title: t("walkthrough.step1Title"), body: t("walkthrough.step1Body"), emoji: "👋" },
    { title: t("walkthrough.step2Title"), body: t("walkthrough.step2Body"), emoji: "📱" },
    { title: t("walkthrough.step3Title"), body: t("walkthrough.step3Body"), emoji: "🛟" },
  ];

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(p);
  }, []);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(WALKTHROUGH_DONE_KEY, "1");
    onDone();
  }, [onDone]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.skip}>{t("common.skip")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, page === i && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={page === slides.length - 1 ? finish : () => setPage(page + 1)}>
        <Text style={styles.buttonText}>
          {page === slides.length - 1 ? t("common.getStarted") : t("common.next")}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
  },
  skip: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 72, marginBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 360,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    backgroundColor: "#1E3A8A",
    width: 24,
  },
  button: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: "#1E3A8A",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
