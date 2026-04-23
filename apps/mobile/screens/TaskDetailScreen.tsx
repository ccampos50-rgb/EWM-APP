import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  completeTask,
  fetchTask,
  resolveScanCode,
  startTask,
  type TaskRow,
} from "../lib/db";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "TaskDetail">;

type ScanGoal = "start" | "complete" | null;

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [scanGoal, setScanGoal] = useState<ScanGoal>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const load = useCallback(async () => {
    try {
      const t = await fetchTask(taskId);
      setTask(t);
      setNotes(t?.notes ?? "");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load task.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const openScanner = async (goal: Exclude<ScanGoal, null>) => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Camera required", "Grant camera access to scan codes.");
        return;
      }
    }
    setScanGoal(goal);
  };

  const handleScanned = async (code: string) => {
    if (!task || !scanGoal) return;
    setScanGoal(null);
    setBusy(true);
    try {
      const resolved = await resolveScanCode(task.site_id, code);
      if (!resolved) {
        Alert.alert("Unknown code", `"${code}" isn't registered at this site.`);
        return;
      }
      if (scanGoal === "start") {
        await startTask(task.id, resolved.entity_ref);
      } else {
        await completeTask(task.id, { scannedCode: resolved.entity_ref, notes });
      }
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Scan action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartWithoutScan = async () => {
    if (!task) return;
    setBusy(true);
    try {
      await startTask(task.id);
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to start task.");
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteWithoutScan = async () => {
    if (!task) return;
    setBusy(true);
    try {
      await completeTask(task.id, { notes });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to complete task.");
    } finally {
      setBusy(false);
    }
  };

  if (scanGoal) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>
            {scanGoal === "start" ? "Scan to start" : "Scan to complete"}
          </Text>
          <TouchableOpacity onPress={() => setScanGoal(null)}>
            <Text style={styles.scannerCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"] }}
          onBarcodeScanned={({ data }) => handleScanned(data)}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text>Task not found.</Text>
      </SafeAreaView>
    );
  }

  const requiresScan = task.template?.requires_scan ?? false;
  const isAssigned = task.status === "assigned";
  const isInProgress = task.status === "in_progress";
  const isDone = task.status === "done";

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>{task.template?.label ?? task.template_code}</Text>
        {task.target_ref && <Text style={styles.target}>Target: {task.target_ref}</Text>}
        {task.template?.expected_minutes != null && (
          <Text style={styles.meta}>Expected: ~{task.template.expected_minutes} min</Text>
        )}
        <Text style={styles.meta}>Status: {task.status.replace("_", " ")}</Text>

        <View style={styles.notesBlock}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Optional notes for this task"
            placeholderTextColor="#94A3B8"
            style={styles.notesInput}
            editable={!isDone}
          />
        </View>

        {isAssigned && (
          <>
            {requiresScan ? (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={() => openScanner("start")}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Scan to start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={handleStartWithoutScan}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Start task</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isInProgress && (
          <>
            {requiresScan ? (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={() => openScanner("complete")}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Scan to complete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={handleCompleteWithoutScan}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Mark complete</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isDone && (
          <View style={styles.doneBlock}>
            <Text style={styles.doneText}>Completed</Text>
            {task.completed_at && (
              <Text style={styles.doneMeta}>
                at {new Date(task.completed_at).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  label: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  target: { fontSize: 15, color: "#0EA5E9", marginTop: 8 },
  meta: { fontSize: 13, color: "#64748B", marginTop: 4, textTransform: "capitalize" },
  notesBlock: { marginTop: 24 },
  notesLabel: { fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 6 },
  notesInput: {
    minHeight: 80,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  primary: {
    marginTop: 24,
    backgroundColor: "#1E3A8A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  doneBlock: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  doneText: { color: "#16A34A", fontSize: 15, fontWeight: "600" },
  doneMeta: { color: "#16A34A", fontSize: 12, marginTop: 2 },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0F172A",
  },
  scannerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scannerCancel: { color: "#CBD5E1", fontSize: 15 },
  camera: { flex: 1 },
});
