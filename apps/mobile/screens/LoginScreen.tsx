import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
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
import { colors } from "../lib/theme";

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
      <View style={styles.hero}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>{t("brand.name")}</Text>
        <Text style={styles.tagline}>{t("brand.tagline")}</Text>
      </View>

      <View style={styles.card}>
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
            placeholderTextColor={colors.textSubtle}
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
            placeholderTextColor={colors.textSubtle}
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

        <Text style={styles.web}>{t("brand.web")}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navyDeep,
    justifyContent: "center",
    padding: 24,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 16,
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
  },
  tagline: {
    fontSize: 12,
    color: colors.chevron,
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.card,
    padding: 28,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  web: {
    fontSize: 11,
    color: colors.textSubtle,
    textAlign: "center",
    marginTop: 16,
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
    borderColor: colors.borderInput,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.navy,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  langToggle: {
    marginTop: 16,
    alignItems: "center",
  },
  langToggleText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "500",
  },
});
