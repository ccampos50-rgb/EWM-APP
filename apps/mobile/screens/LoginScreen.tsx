import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../lib/auth";
import { i18n } from "../lib/i18n";

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t("login.missingFields"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: authError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (authError) setError(authError);
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(next);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>{t("brand.name")}</Text>
        <Text style={styles.tagline}>{t("brand.tagline")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("login.email")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
            placeholder={t("login.emailPlaceholder")}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("login.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder={t("login.passwordPlaceholder")}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, submitting && styles.buttonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("login.signIn")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleLang} style={styles.langToggle}>
          <Text style={styles.langToggleText}>
            {i18n.language === "en" ? "Español" : "English"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
    textAlign: "center",
  },
  tagline: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  error: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  langToggle: {
    marginTop: 16,
    alignItems: "center",
  },
  langToggleText: {
    color: "#0EA5E9",
    fontSize: 13,
    fontWeight: "500",
  },
});
