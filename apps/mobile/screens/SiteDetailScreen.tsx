import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clockIn,
  distanceMeters,
  fetchSite,
  fetchTodaysShift,
  type ShiftRow,
  type SiteRow,
} from "../lib/db";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SiteDetail">;

export function SiteDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { siteId } = route.params;
  const [site, setSite] = useState<SiteRow | null>(null);
  const [shift, setShift] = useState<ShiftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, sh] = await Promise.all([fetchSite(siteId), fetchTodaysShift(siteId)]);
      setSite(s);
      setShift(sh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClockIn = async () => {
    if (!site || !shift) return;
    setClocking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("siteDetail.locationRequired"), t("siteDetail.locationRequiredBody"));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (site.latitude != null && site.longitude != null) {
        const d = distanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          site.latitude,
          site.longitude,
        );
        if (d > site.geofence_radius_m) {
          Alert.alert(
            t("siteDetail.tooFar"),
            t("siteDetail.tooFarBody", {
              distance: Math.round(d),
              radius: site.geofence_radius_m,
            }),
          );
          return;
        }
      }

      await clockIn(shift.id, position.coords.latitude, position.coords.longitude);
      navigation.replace("TaskList", { shiftId: shift.id, siteName: site.name, siteId: site.id });
    } catch (e) {
      Alert.alert(
        t("siteDetail.clockInFailed"),
        e instanceof Error ? e.message : t("common.error"),
      );
    } finally {
      setClocking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  if (!site) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text>{t("siteDetail.siteNotFound")}</Text>
      </SafeAreaView>
    );
  }

  const alreadyClockedIn = shift?.status === "clocked_in";
  const canClockIn = shift && shift.status === "scheduled";

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.siteName}>{site.name}</Text>
        {site.customer && (
          <Text style={styles.customer}>
            {site.customer.name} · {site.customer.vertical.replace("_", " ")}
          </Text>
        )}
        {site.address && <Text style={styles.address}>{site.address}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("siteDetail.todayShift")}</Text>
          {shift ? (
            <>
              <Text style={styles.cardValue}>
                {new Date(shift.scheduled_start).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(shift.scheduled_end).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.cardHint}>
                {t("siteDetail.statusPrefix")} {shift.status.replace("_", " ")}
              </Text>
            </>
          ) : (
            <Text style={styles.cardHint}>{t("siteDetail.noShift")}</Text>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {canClockIn && (
          <TouchableOpacity
            style={[styles.primaryButton, clocking && styles.buttonDisabled]}
            onPress={handleClockIn}
            disabled={clocking}
          >
            {clocking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{t("siteDetail.clockIn")}</Text>
            )}
          </TouchableOpacity>
        )}

        {alreadyClockedIn && shift && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate("TaskList", {
                shiftId: shift.id,
                siteName: site.name,
                siteId: site.id,
              })
            }
          >
            <Text style={styles.primaryButtonText}>{t("siteDetail.viewTasks")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  siteName: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  customer: {
    fontSize: 14,
    color: "#0EA5E9",
    marginTop: 6,
    textTransform: "capitalize",
  },
  address: { fontSize: 14, color: "#64748B", marginTop: 8 },
  card: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardLabel: { fontSize: 12, color: "#64748B", textTransform: "uppercase", fontWeight: "600" },
  cardValue: { fontSize: 20, fontWeight: "600", color: "#0F172A", marginTop: 6 },
  cardHint: { fontSize: 13, color: "#64748B", marginTop: 6, textTransform: "capitalize" },
  errorText: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#1E3A8A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
});
