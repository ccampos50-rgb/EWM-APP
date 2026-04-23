import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createIncident } from "../lib/db";
import { captureTaskPhoto } from "../lib/photos";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "IncidentReport">;

const CATEGORIES = [
  { key: "safety", label: "Safety issue" },
  { key: "equipment", label: "Equipment problem" },
  { key: "supply", label: "Supply shortage" },
  { key: "client_complaint", label: "Client complaint" },
  { key: "property_damage", label: "Property damage" },
  { key: "other", label: "Other" },
];

const SEVERITIES: Array<{ key: "low" | "medium" | "high"; label: string; color: string }> = [
  { key: "low", label: "Low", color: "#64748B" },
  { key: "medium", label: "Medium", color: "#D97706" },
  { key: "high", label: "High", color: "#DC2626" },
];

export function IncidentReportScreen({ route, navigation }: Props) {
  const { siteId, siteName } = route.params;
  const [category, setCategory] = useState<string | null>(null);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addPhoto = async () => {
    setCapturingPhoto(true);
    try {
      const result = await captureTaskPhoto();
      if (result) setPhotoUrl(result.publicUrl);
    } catch (e) {
      Alert.alert("Photo error", e instanceof Error ? e.message : "Capture failed.");
    } finally {
      setCapturingPhoto(false);
    }
  };

  const submit = async () => {
    if (!category) {
      Alert.alert("Category required", "Pick a category for this incident.");
      return;
    }
    setSubmitting(true);
    try {
      await createIncident({
        siteId,
        category,
        severity,
        description: description.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
      });
      Alert.alert("Incident reported", "Your site manager has been notified.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Report an incident</Text>
        <Text style={styles.subheading}>{siteName}</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
              onPress={() => setCategory(c.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  category === c.key && styles.categoryChipTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.severityButton,
                severity === s.key && { backgroundColor: s.color, borderColor: s.color },
              ]}
              onPress={() => setSeverity(s.key)}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === s.key && styles.severityTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>What happened?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Describe the issue (optional)"
          placeholderTextColor="#94A3B8"
          style={styles.textArea}
        />

        <Text style={styles.label}>Photo (optional)</Text>
        {photoUrl ? (
          <View>
            <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
            <TouchableOpacity onPress={() => setPhotoUrl(null)} style={styles.photoClear}>
              <Text style={styles.photoClearText}>Remove photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.photoButton, capturingPhoto && styles.disabled]}
            onPress={addPhoto}
            disabled={capturingPhoto}
          >
            {capturingPhoto ? (
              <ActivityIndicator color="#1E3A8A" />
            ) : (
              <Text style={styles.photoButtonText}>📷 Add photo</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submit, (submitting || !category) && styles.disabled]}
          onPress={submit}
          disabled={submitting || !category}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  subheading: { fontSize: 14, color: "#64748B", marginTop: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginTop: 24,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
  },
  categoryChipActive: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  categoryChipText: { fontSize: 13, color: "#334155" },
  categoryChipTextActive: { color: "#fff", fontWeight: "500" },
  severityRow: { flexDirection: "row", gap: 8 },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  severityText: { fontSize: 13, color: "#334155", fontWeight: "500" },
  severityTextActive: { color: "#fff" },
  textArea: {
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  photoButton: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  photoButtonText: { fontSize: 14, color: "#334155" },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  photoClear: { alignItems: "center", paddingVertical: 8 },
  photoClearText: { fontSize: 13, color: "#DC2626" },
  submit: {
    marginTop: 28,
    backgroundColor: "#1E3A8A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
