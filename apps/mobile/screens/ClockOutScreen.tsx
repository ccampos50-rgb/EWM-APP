import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clockOut, fetchShiftTasks, type TaskRow } from "../lib/db";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ClockOut">;

export function ClockOutScreen({ route, navigation }: Props) {
  const { shiftId } = route.params;
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTasks(await fetchShiftTasks(shiftId));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    load();
  }, [load]);

  const done = tasks.filter((t) => t.status === "done").length;
  const open = tasks.filter(
    (t) => t.status === "assigned" || t.status === "in_progress",
  ).length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;

  const confirmClockOut = () => {
    if (open > 0) {
      Alert.alert(
        `${open} open task${open === 1 ? "" : "s"}`,
        "Clock out anyway? Open tasks will stay assigned for tomorrow.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clock out", style: "destructive", onPress: doClockOut },
        ],
      );
      return;
    }
    doClockOut();
  };

  const doClockOut = async () => {
    setBusy(true);
    try {
      await clockOut(shiftId);
      navigation.reset({ index: 0, routes: [{ name: "Sites" }] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Clock out failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.heading}>Shift summary</Text>

        <View style={styles.statsRow}>
          <Stat label="Done" value={done} color="#16A34A" />
          <Stat label="Open" value={open} color="#F59E0B" />
          <Stat label="Blocked" value={blocked} color="#DC2626" />
        </View>

        <TouchableOpacity
          style={[styles.primary, busy && styles.disabled]}
          onPress={confirmClockOut}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Clock out</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancel}>
          <Text style={styles.cancelText}>Back to tasks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0F172A", marginBottom: 24 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 32, fontWeight: "700" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4, textTransform: "uppercase" },
  primary: {
    marginTop: 32,
    backgroundColor: "#1E3A8A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  cancel: { marginTop: 16, alignItems: "center" },
  cancelText: { color: "#64748B", fontSize: 14 },
});
