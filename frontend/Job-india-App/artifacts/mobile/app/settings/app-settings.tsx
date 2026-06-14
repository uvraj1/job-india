import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings, Language, ThemeMode } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";

const LANGUAGES: { key: Language; label: string; native: string }[] = [
  { key: "English", label: "English", native: "English" },
  { key: "Hindi", label: "Hindi", native: "हिन्दी" },
  { key: "Bengali", label: "Bengali", native: "বাংলা" },
  { key: "Telugu", label: "Telugu", native: "తెలుగు" },
  { key: "Tamil", label: "Tamil", native: "தமிழ்" },
  { key: "Marathi", label: "Marathi", native: "मराठी" },
  { key: "Gujarati", label: "Gujarati", native: "ગુજરાતી" },
  { key: "Kannada", label: "Kannada", native: "ಕನ್ನಡ" },
];

const THEMES: {
  key: ThemeMode;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  desc: string;
}[] = [
  {
    key: "light",
    label: "Light Mode",
    icon: "sun",
    desc: "Always use light look",
  },
  {
    key: "dark",
    label: "Dark Mode",
    icon: "moon",
    desc: "Always use dark look",
  },
  {
    key: "system",
    label: "Use Phone Setting",
    icon: "monitor",
    desc: "Use the same setting as your phone",
  },
];

export default function AppSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateAppConfig, clearCache } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const appConfig = settings.appConfig;
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const [clearing, setClearing] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      t("clear_cache"),
      "This will remove temp files and reset app settings. Your account and applied jobs will stay safe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            await clearCache();
            setClearing(false);
            Alert.alert("Done", "Cache is cleared.");
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: "#6B4226" },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("app_settings")}</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>Language, look, and app options</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          {t("app_language")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {LANGUAGES.map((lang, idx) => {
            const selected = appConfig.language === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.langRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < LANGUAGES.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() => updateAppConfig({ language: lang.key })}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: selected ? colors.secondary : colors.foreground,
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    style={[
                      styles.langNative,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {lang.native}
                  </Text>
                </View>
                {selected && (
                  <View
                    style={[
                      styles.selectedBadge,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          {t("app_look")}
        </Text>
        <View style={styles.themeRow}>
          {THEMES.map(({ key, label, icon, desc }) => {
            const selected = appConfig.themeMode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => updateAppConfig({ themeMode: key })}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.themeIconCircle,
                    {
                      backgroundColor: selected
                        ? "rgba(255,255,255,0.2)"
                        : colors.muted,
                    },
                  ]}
                >
                  <Feather
                    name={icon}
                    size={20}
                    color={selected ? "#fff" : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.themeLabel,
                    { color: selected ? "#fff" : colors.foreground },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.themeDesc,
                    {
                      color: selected
                        ? "rgba(255,255,255,0.7)"
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.cacheBtn}
          onPress={handleClearCache}
          disabled={clearing}
        >
          <Text style={{ color: colors.secondary, fontWeight: "600" }}>
            {clearing ? "Clearing..." : t("clear_cache")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  scroll: { padding: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langLabel: { fontSize: 15, fontWeight: "600" },
  langNative: { fontSize: 12, marginTop: 2 },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  themeRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  themeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  themeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  themeLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  themeDesc: { fontSize: 11, textAlign: "center" },
  cacheBtn: { marginTop: 32, alignItems: "center", padding: 16 },
});
