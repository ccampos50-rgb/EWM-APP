import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "../lib/auth";
import { fetchAccessibleSites, type SiteRow } from "../lib/db";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Sites">;

export function SitesScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSites(await fetchAccessibleSites());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>EWM</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Your sites</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1E3A8A" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sites.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No sites assigned</Text>
          <Text style={styles.emptyText}>
            Ask your site manager to add you to a site roster.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sites}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("SiteDetail", { siteId: item.id })}
            >
              <Text style={styles.siteName}>{item.name}</Text>
              {item.customer && (
                <Text style={styles.customerName}>
                  {item.customer.name} · {item.customer.vertical.replace("_", " ")}
                </Text>
              )}
              {item.address && <Text style={styles.address}>{item.address}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  brand: { fontSize: 20, fontWeight: "700", color: "#1E3A8A" },
  email: { fontSize: 12, color: "#64748B", marginTop: 2 },
  signOut: { fontSize: 14, color: "#475569" },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: "#0F172A",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  siteName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  customerName: {
    fontSize: 13,
    color: "#0EA5E9",
    marginTop: 4,
    textTransform: "capitalize",
  },
  address: { fontSize: 13, color: "#64748B", marginTop: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#DC2626", fontSize: 14, textAlign: "center" },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1E3A8A",
    borderRadius: 6,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
  },
});
