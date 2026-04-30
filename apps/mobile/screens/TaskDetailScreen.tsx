import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { captureTaskPhoto } from "../lib/photos";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "TaskDetail">;

type ScanGoal = "start" | "complete" | null;

export function TaskDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { taskId } = route.params;
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [scanGoal, setScanGoal] = useState<ScanGoal>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const load = useCallback(async () => {
    try {
      const fetched = await fetchTask(taskId);
      setTask(fetched);
      setNotes(fetched?.notes ?? "");
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : "Failed to load task.");
    } finally {
      setLoading(false);
    }
  }, [taskId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openScanner = async (goal: Exclude<ScanGoal, null>) => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(t("taskDetail.cameraRequired"), t("taskDetail.cameraRequiredBody"));
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
        Alert.alert(t("taskDetail.unknownCode"), t("taskDetail.unknownCodeBody", { code }));
        return;
      }
      if (scanGoal === "start") {
        await startTask(task.id, resolved.entity_ref);
      } else {
        const photoUrl = await maybeCapturePhoto(task);
        await completeTask(task.id, {
          scannedCode: resolved.entity_ref,
          notes,
          photoUrl: photoUrl ?? undefined,
        });
      }
      await load();
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : "Scan action failed.");
    } finally {
      setBusy(false);
    }
  };

  const maybeCapturePhoto = async (taskArg: TaskRow): Promise<string | null> => {
    if (!taskArg.template?.requires_photo) return null;
    const photo = await captureTaskPhoto();
    if (!photo) {
      throw new Error(t("taskDetail.photoRequired"));
    }
    return photo.publicUrl;
  };

  const handleStartWithoutScan = async () => {
    if (!task) return;
    setBusy(true);
    try {
      await startTask(task.id);
      await load();
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : "Failed to start task.");
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteWithoutScan = async () => {
    if (!task) return;
    setBusy(true);
    try {
      const photoUrl = await maybeCapturePhoto(task);
      await completeTask(task.id, { notes, photoUrl: photoUrl ?? undefined });
      navigation.goBack();
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : "Failed to complete task.");
    } finally {
      setBusy(false);
    }
  };

  if (scanGoal) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>
            {scanGoal === "start" ? t("taskDetail.scanToStart") : t("taskDetail.scanToComplete")}
          </Text>
          <TouchableOpacity onPress={() => setScanGoal(null)}>
            <Text style={styles.scannerCancel}>{t("common.cancel")}</Text>
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
        <ActivityIndicator color="#1B3A4C" />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text>{t("taskDetail.taskNotFound")}</Text>
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
        {task.target_ref && (
          <Text style={styles.target}>{t("taskDetail.target", { ref: task.target_ref })}</Text>
        )}
        {task.template?.expected_minutes != null && (
          <Text style={styles.meta}>
            {t("taskDetail.expected", { minutes: task.template.expected_minutes })}
          </Text>
        )}
        <Text style={styles.meta}>
          {t("siteDetail.statusPrefix")} {task.status.replace("_", " ")}
        </Text>

        <View style={styles.notesBlock}>
          <Text style={styles.notesLabel}>{t("taskDetail.notes")}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={t("taskDetail.notesPlaceholder")}
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
                <Text style={styles.primaryText}>{t("taskDetail.scanToStart")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={handleStartWithoutScan}
                disabled={busy}
              >
                <Text style={styles.primaryText}>{t("taskDetail.startTask")}</Text>
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
                <Text style={styles.primaryText}>{t("taskDetail.scanToComplete")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primary, busy && styles.disabled]}
                onPress={handleCompleteWithoutScan}
                disabled={busy}
              >
                <Text style={styles.primaryText}>{t("taskDetail.markComplete")}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isDone && (
          <View style={styles.doneBlock}>
            <Text style={styles.doneText}>{t("taskDetail.completed")}</Text>
            {task.completed_at && (
              <Text style={styles.doneMeta}>
                {t("taskDetail.completedAt", {
                  time: new Date(task.completed_at).toLocaleTimeString(),
                })}
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
  target: { fontSize: 15, color: "#3D7A9A", marginTop: 8 },
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
    backgroundColor: "#1B3A4C",
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
