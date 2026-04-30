import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchShiftTasks, type TaskRow } from "../lib/db";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

const STATUS_COLORS: Record<TaskRow["status"], string> = {
  assigned: "#64748B",
  in_progress: "#3D7A9A",
  done: "#16A34A",
  blocked: "#DC2626",
  skipped: "#94A3B8",
};

export function TaskListScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { shiftId, siteName, siteId } = route.params;
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTasks(await fetchShiftTasks(shiftId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("taskList.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [shiftId, t]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const openCount = tasks.filter((t) => t.status === "assigned" || t.status === "in_progress")
    .length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.siteName}>{siteName}</Text>
        <Text style={styles.summary}>
          {t("taskList.count", { total: tasks.length, open: openCount })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1B3A4C" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{t("taskList.emptyTitle")}</Text>
          <Text style={styles.emptyText}>{t("taskList.emptyText")}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.status === "done" && styles.cardDone]}
              onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
            >
              <View style={styles.row}>
                <Text style={[styles.label, item.status === "done" && styles.labelDone]}>
                  {item.template?.label ?? item.template_code}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] }]}>
                  <Text style={styles.statusPillText}>{item.status.replace("_", " ")}</Text>
                </View>
              </View>
              {item.target_ref && (
                <Text style={styles.target}>{t("taskDetail.target", { ref: item.target_ref })}</Text>
              )}
              {item.template?.expected_minutes != null && (
                <Text style={styles.meta}>~{item.template.expected_minutes} min</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.incidentButton}
          onPress={() => navigation.navigate("IncidentReport", { siteId, siteName })}
        >
          <Text style={styles.incidentButtonText}>{t("taskList.reportIncident")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clockOutButton}
          onPress={() => navigation.navigate("ClockOut", { shiftId })}
        >
          <Text style={styles.clockOutText}>{t("taskList.clockOut")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  siteName: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  summary: { fontSize: 13, color: "#64748B", marginTop: 4 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardDone: { opacity: 0.6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "600", color: "#0F172A", flex: 1 },
  labelDone: { textDecorationLine: "line-through" },
  target: { fontSize: 13, color: "#475569", marginTop: 4 },
  meta: { fontSize: 12, color: "#64748B", marginTop: 4 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#DC2626", fontSize: 14, textAlign: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  emptyText: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: "center" },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  incidentButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  incidentButtonText: { color: "#475569", fontSize: 14, fontWeight: "500" },
  clockOutButton: {
    flex: 1,
    backgroundColor: "#475569",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clockOutText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
