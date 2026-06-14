import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { useSubscription } from "@/context/SubscriptionContext";

type SettingsSection = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label_key: string;
  sublabel_key: string;
  route: string;
  iconBg: string;
};

const SECTIONS: SettingsSection[] = [
  {
    key: "edit_profile",
    icon: "edit-2",
    label_key: "edit_profile",
    sublabel_key: "Photo, study, work, skills",
    route: "/settings/profile-edit",
    iconBg: "#2563EB",
  },
  {
    key: "umma_chat",
    icon: "message-square",
    label_key: "chat_with_umma",
    sublabel_key: "AI Assistant for jobs and support",
    route: "/settings/umma-chat",
    iconBg: "#8B5CF6",
  },
  {
    key: "hiring_partner",
    icon: "briefcase",
    label_key: "hiring_partner",
    sublabel_key: "Login, post jobs & manage applications",
    route: "/company-portal",
    iconBg: "#059669",
  },
  {
    key: "account_settings",
    icon: "user",
    label_key: "account_settings",
    sublabel_key: "Profile, password, delete account",
    route: "/settings/account",
    iconBg: "#1A3A5C",
  },
  {
    key: "job_preferences",
    icon: "briefcase",
    label_key: "job_preferences",
    sublabel_key: "Job type, location, salary, industry",
    route: "/settings/job-preferences",
    iconBg: "#E07B39",
  },
  {
    key: "notifications",
    icon: "bell",
    label_key: "notifications",
    sublabel_key: "Push alerts, email, alert types",
    route: "/settings/notifications",
    iconBg: "#7B2D8B",
  },
  // ── 3rd from last ──
  {
    key: "membership",
    icon: "award",
    label_key: "membership_management",
    sublabel_key: "Plan details, upgrade, cancel subscription",
    route: "/settings/membership",
    iconBg: "#B45309",
  },
  {
    key: "privacy",
    icon: "shield",
    label_key: "privacy_visibility",
    sublabel_key: "Who can see resume, blocked companies",
    route: "/settings/privacy",
    iconBg: "#2D6A4F",
  },
  {
    key: "app_settings",
    icon: "settings",
    label_key: "app_settings",
    sublabel_key: "Language, look, clear cache",
    route: "/settings/app-settings",
    iconBg: "#6B4226",
  },
  {
    key: "support",
    icon: "help-circle",
    label_key: "support_about",
    sublabel_key: "Help, common questions, rate us, legal",
    route: "/settings/support",
    iconBg: "#1A5276",
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const { subscription } = useSubscription();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const [searchQuery, setSearchQuery] = useState("");

  const isProActive = subscription.isActive;
  const expiryStr = subscription.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return SECTIONS;

    return SECTIONS.filter((section) =>
      `${t(section.label_key)} ${section.sublabel_key}`.toLowerCase().includes(query),
    );
  }, [searchQuery, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings")}</Text>
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
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("search_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {filteredSections.map((section, idx) => (
            <React.Fragment key={section.key}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(section.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        section.key === "membership" && isProActive
                          ? "#92400E"
                          : section.iconBg,
                    },
                  ]}
                >
                  <Feather name={section.icon} size={18} color="#fff" />
                </View>
                <View style={styles.rowText}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                      {section.key === "membership" ? "Membership Management" : t(section.label_key)}
                    </Text>
                    {section.key === "membership" && (
                      <View style={[
                        styles.memberBadge,
                        { backgroundColor: isProActive ? "#FEF3C7" : colors.muted }
                      ]}>
                        <Feather
                          name={isProActive ? "star" : "lock"}
                          size={10}
                          color={isProActive ? "#92400E" : colors.mutedForeground}
                        />
                        <Text style={[
                          styles.memberBadgeText,
                          { color: isProActive ? "#92400E" : colors.mutedForeground }
                        ]}>
                          {isProActive ? "PRO" : "FREE"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    {section.key === "membership"
                      ? isProActive
                        ? `Pro Active • Renews ${expiryStr ?? ""}`
                        : "Upgrade to Pro — unlock all features"
                      : section.sublabel_key}
                  </Text>
                </View>
                {section.key === "membership" ? (
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={isProActive ? "#B45309" : colors.mutedForeground}
                  />
                ) : (
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
              {idx < filteredSections.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}

          {filteredSections.length === 0 && (
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No result found for "{searchQuery.trim()}"
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {t("sign_out")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Job India • Version 1.0.0
        </Text>
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
    marginBottom: 16,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800" as any, color: "#fff" },
  scroll: { padding: 16, gap: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: { flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  rowLabel: { fontSize: 15, fontWeight: "600" as any },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  memberBadgeText: { fontSize: 9, fontWeight: "900" as any, letterSpacing: 0.5 },
  rowSub: { fontSize: 12 },
  divider: { height: 1, marginLeft: 72 },
  emptyState: { padding: 16 },
  emptyText: { fontSize: 13, textAlign: "center" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: "700" as any },
  version: { textAlign: "center", fontSize: 12, marginTop: 8 },
});
