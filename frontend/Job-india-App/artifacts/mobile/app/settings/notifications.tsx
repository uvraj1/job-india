import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onToggle,
  disabled,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        { borderBottomColor: colors.border, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <View style={[styles.toggleIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        trackColor={{ false: colors.muted, true: colors.secondary }}
        thumbColor={value ? "#fff" : colors.mutedForeground}
        disabled={disabled}
      />
    </View>
  );
}

import { db, auth } from "../../utils/firebase";
import { ref, update } from "firebase/database";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateNotifications } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const notifs = settings.notifications;
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const handleTogglePush = async (value: boolean) => {
    updateNotifications({ pushEnabled: value });

    // Logic to update subscription in Firebase/Topic
    if (auth.currentUser) {
      const profileRef = ref(
        db,
        `profiles/${auth.currentUser.uid}/notification_settings`,
      );
      await update(profileRef, { pushEnabled: value });
    }

    if (value) {
      // Logic for subscribing to topic can be handled by backend
      // or here using an API if available in Expo (topic sub usually needs native code or a bridge)
      console.log("Push notifications enabled");
    }
  };

  const masterOff = !notifs.pushEnabled && !notifs.emailEnabled;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: "#7B2D8B" },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notifications")}</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>Control what alerts you receive</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Master toggles */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          CHANNELS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ToggleRow
            icon="smartphone"
            label="Push Notifications"
            sublabel="Alerts on your mobile screen"
            value={notifs.pushEnabled}
            onToggle={handleTogglePush}
            colors={colors}
          />
          <ToggleRow
            icon="mail"
            label="Email Alerts"
            sublabel="Updates sent to your inbox"
            value={notifs.emailEnabled}
            onToggle={(v) => updateNotifications({ emailEnabled: v })}
            colors={colors}
          />
        </View>

        {/* Alert categories */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          ALERT CATEGORIES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ToggleRow
            icon="briefcase"
            label="New Job Alerts"
            sublabel="Notified when jobs matching your profile appear"
            value={notifs.newJobAlerts}
            onToggle={(v) => updateNotifications({ newJobAlerts: v })}
            disabled={masterOff}
            colors={colors}
          />
          <ToggleRow
            icon="file-text"
            label="Application Status"
            sublabel="When HR views, shortlists, or rejects your application"
            value={notifs.applicationStatus}
            onToggle={(v) => updateNotifications({ applicationStatus: v })}
            disabled={masterOff}
            colors={colors}
          />
          <ToggleRow
            icon="zap"
            label="Platform Updates"
            sublabel="New features, career tips, and app announcements"
            value={notifs.platformUpdates}
            onToggle={(v) => updateNotifications({ platformUpdates: v })}
            disabled={masterOff}
            colors={colors}
          />
        </View>

        {masterOff && (
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: colors.accent, borderColor: colors.secondary },
            ]}
          >
            <Feather name="bell-off" size={16} color={colors.secondary} />
            <Text style={[styles.warningText, { color: colors.secondary }]}>
              All notifications are off. Enable Push or Email to receive alerts.
            </Text>
          </View>
        )}

        <View style={[styles.infoBanner, { backgroundColor: colors.muted }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Alert categories are only active when at least one channel (Push or
            Email) is enabled. Changes are saved automatically.
          </Text>
        </View>
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
  headerTitle: { fontSize: 20, fontWeight: "800" as const, color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  scroll: { padding: 16, gap: 4 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 15, fontWeight: "600" as const },
  toggleSub: { fontSize: 12, marginTop: 2 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  warningText: { fontSize: 13, fontWeight: "500" as const, flex: 1 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
