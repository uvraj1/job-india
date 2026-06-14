import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { robustApiClient } from "../../utils/robustApiClient";

export default function CompanyRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const [form, setForm] = useState({
    company_name: "",
    company_id: "",
    password: "",
    email: "",
    phone: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.company_name || !form.company_id || !form.password) {
      Alert.alert("Error", "Please fill in all required fields (*)");
      return;
    }

    setLoading(true);
    try {
      const response = await robustApiClient.registerCompany(form);

      if (response.success) {
        Alert.alert(
          "Success",
          "Company registered successfully! You can now login through the company portal.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", response.error || response.message || "Registration failed");
      }
    } catch (err) {
      console.error("Company register error:", err);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("hiring_partner")}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.webPortalBtn}
          onPress={() => Linking.openURL(robustApiClient.getCompanyPortalUrl())}
        >
          <LinearGradient
            colors={["#059669", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.webPortalGradient}
          >
            <View style={styles.webPortalContent}>
              <Feather name="globe" size={20} color="#fff" />
              <View>
                <Text style={styles.webPortalTitle}>Open Web Company Portal</Text>
                <Text style={styles.webPortalSub}>For full dashboard & job management</Text>
              </View>
            </View>
            <Feather name="external-link" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR REGISTER VIA APP</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.introBox}>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Register Your Company</Text>
          <Text style={[styles.introSub, { color: colors.mutedForeground }]}>
            Join as a hiring partner to post jobs and find the best talent across India.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Company Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Reliance, TCS"
              placeholderTextColor={colors.mutedForeground}
              value={form.company_name}
              onChangeText={(v) => updateForm("company_name", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Choose Company ID *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Unique ID for login"
              placeholderTextColor={colors.mutedForeground}
              value={form.company_id}
              autoCapitalize="none"
              onChangeText={(v) => updateForm("company_id", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Portal Password *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Create a strong password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={form.password}
              onChangeText={(v) => updateForm("password", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Official Email</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="jobindia.customar.services@gmail.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => updateForm("email", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Contact Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => updateForm("phone", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Website URL</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="https://www.company.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="url"
              autoCapitalize="none"
              value={form.website}
              onChangeText={(v) => updateForm("website", v)}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>Register Now</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          By registering, you agree to Job India's terms for hiring partners.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  scroll: { padding: 20 },
  webPortalBtn: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  webPortalGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  webPortalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  webPortalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  webPortalSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  introBox: { marginBottom: 24 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  introSub: { fontSize: 14, lineHeight: 20 },
  formCard: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  registerBtn: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footerText: { textAlign: "center", fontSize: 12, marginTop: 24, lineHeight: 18 },
});
