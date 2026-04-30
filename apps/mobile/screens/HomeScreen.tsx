import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../lib/auth";

export function HomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>EWM</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.email}>{session?.user.email}</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>No site selected</Text>
          <Text style={styles.placeholderText}>
            Site picker + today's task list drop in here once the worker is assigned to a shift.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  brand: { fontSize: 20, fontWeight: "700", color: "#1B3A4C" },
  signOut: { fontSize: 14, color: "#475569" },
  body: { flex: 1, padding: 24 },
  heading: { fontSize: 24, fontWeight: "600", color: "#0F172A" },
  email: { fontSize: 14, color: "#64748B", marginTop: 4 },
  placeholder: {
    marginTop: 32,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
  },
  placeholderTitle: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  placeholderText: { fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 18 },
});
