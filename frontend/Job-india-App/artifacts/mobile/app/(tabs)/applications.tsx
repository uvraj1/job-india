import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { db, auth } from "../../utils/firebase";
import { get, onValue, ref, remove } from "firebase/database";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown } from "react-native-reanimated";

// ─── Types ─────────────────────────────────────────────────────────────────
type ApplicationRecord = {
  id: string;
  job_id: string;
  title: string;
  organization: string;
  location?: string;
  category?: string;
  status: string;
  applied_at: number;
  salary?: string;
  job_type?: string;
};

// ─── Status colors ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Applied:    { bg: "#EFF6FF", text: "#2563EB", icon: "send" },
  Pending:    { bg: "#FFF7ED", text: "#D97706", icon: "clock" },
  Shortlisted:{ bg: "#F0FDF4", text: "#16A34A", icon: "check-circle" },
  Rejected:   { bg: "#FEF2F2", text: "#DC2626", icon: "x-circle" },
  Interview:  { bg: "#FAF5FF", text: "#7C3AED", icon: "calendar" },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS["Applied"];
}

function formatDate(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function timeSince(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function ApplicationsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t }   = useTranslation(settings.appConfig.language);
  const topPad  = Platform.OS === "web" ? 24 : insets.top;

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep track of active Firebase listener so we can clean up on user change
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ─── Subscribe to ONLY this user's applications ─────────────────────────
  useEffect(() => {
    // Cleanup previous listener immediately when user changes
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Get the definitive UID — prefer Firebase Auth UID (most reliable)
    const uid = auth?.currentUser?.uid ?? user?.id;

    if (!uid) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Real-time listener scoped strictly to this user's UID path
    const appsRef = ref(db, `applications/${uid}`);
    const unsub = onValue(
      appsRef,
      (snapshot) => {
        const raw = snapshot.val();
        if (!raw) {
          setApplications([]);
        } else {
          const list: ApplicationRecord[] = Object.entries(raw).map(
            ([key, val]: [string, any]) => ({
              id: key,
              job_id:       val.job_id || key,
              title:        val.title || "Job Application",
              organization: val.organization || val.company || "Company",
              location:     val.location || val.state || "India",
              category:     val.category || "",
              status:       val.status || "Applied",
              applied_at:   val.applied_at || Date.now(),
              salary:       val.salary || null,
              job_type:     val.job_type || null,
            })
          );
          // Sort newest first
          list.sort((a, b) => b.applied_at - a.applied_at);
          setApplications(list);
        }
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error("Applications listener error:", error);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    );

    unsubscribeRef.current = unsub;

    // Cleanup on unmount or user change
    return () => {
      unsub();
      unsubscribeRef.current = null;
    };
  }, [user?.id, auth?.currentUser?.uid]);

  // ─── Manual refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const uid = auth?.currentUser?.uid ?? user?.id;
    if (!uid) { setIsRefreshing(false); return; }
    try {
      const snap = await get(ref(db, `applications/${uid}`));
      const raw = snap.val();
      if (!raw) {
        setApplications([]);
      } else {
        const list: ApplicationRecord[] = Object.entries(raw).map(
          ([key, val]: [string, any]) => ({
            id: key,
            job_id:       val.job_id || key,
            title:        val.title || "Job Application",
            organization: val.organization || val.company || "Company",
            location:     val.location || val.state || "India",
            category:     val.category || "",
            status:       val.status || "Applied",
            applied_at:   val.applied_at || Date.now(),
            salary:       val.salary || null,
            job_type:     val.job_type || null,
          })
        );
        list.sort((a, b) => b.applied_at - a.applied_at);
        setApplications(list);
      }
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // ─── Delete application ───────────────────────────────────────────────────
  const handleDelete = (item: ApplicationRecord) => {
    Alert.alert(
      "Application Hatao",
      `"${item.title}" ko apni applied list se hatana chahte hain?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Haan, Hatao",
          style: "destructive",
          onPress: async () => {
            const uid = auth?.currentUser?.uid ?? user?.id;
            if (!uid) return;
            try {
              await remove(ref(db, `applications/${uid}/${item.id}`));
              setApplications((prev) => prev.filter((a) => a.id !== item.id));
            } catch {
              Alert.alert("Error", "Delete nahi ho paya.");
            }
          },
        },
      ]
    );
  };

  // ─── NOT LOGGED IN ────────────────────────────────────────────────────────
  if (!user && !auth?.currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" backgroundColor={colors.primary} translucent />
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={[styles.header, { paddingTop: topPad + 12 }]}
        >
          <Text style={styles.headerTitle}>Applied Jobs</Text>
          <Text style={styles.headerSub}>Aapke job applications yahan dikhenge</Text>
        </LinearGradient>
        <View style={styles.centered}>
          <Feather name="lock" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 16 }]}>
            Login Karein
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Apne applied jobs track karne ke liye pehle login karein
          </Text>
          <TouchableOpacity
            style={[styles.findBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Feather name="log-in" size={16} color="#fff" />
            <Text style={styles.findBtnText}>Login / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: topPad, backgroundColor: colors.primary }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptySub, { color: colors.mutedForeground, marginTop: 12 }]}>
            Applications load ho rahi hain...
          </Text>
        </View>
      </View>
    );
  }

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor={colors.primary} translucent />
      <View style={{ height: topPad, backgroundColor: colors.primary, width: "100%", zIndex: 10, position: "absolute", top: 0 }} />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + "DD"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Applied Jobs</Text>
            <Text style={styles.headerSub}>
              {user?.name ? `${user.name} ke applications` : "Aapke applications"}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Feather name="briefcase" size={14} color="#fff" />
            <Text style={styles.countText}>{applications.length}</Text>
          </View>
        </View>

        {/* Stats strip */}
        {applications.length > 0 && (
          <View style={styles.statsStrip}>
            {(["Applied", "Shortlisted", "Interview", "Rejected"] as const).map((s) => {
              const n = applications.filter((a) => a.status === s).length;
              if (n === 0) return null;
              const style = getStatusStyle(s);
              return (
                <View key={s} style={[styles.statChip, { backgroundColor: style.bg }]}>
                  <Text style={[styles.statChipText, { color: style.text }]}>{n} {s}</Text>
                </View>
              );
            })}
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.muted }]}>
              <Feather name="file-text" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Koi Application Nahi
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Jab aap kisi job ke liye apply karenge, woh yahan track hogi — sirf aapke account pe!
            </Text>
            <TouchableOpacity
              style={[styles.findBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.findBtnText}>Jobs Dhundho</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/job/${item.job_id}` as any)}
                activeOpacity={0.85}
              >
                {/* Top row: org logo placeholder + status + delete */}
                <View style={styles.cardTop}>
                  <View style={[styles.orgLogo, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.orgInitial, { color: colors.primary }]}>
                      {item.organization.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardOrg, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.organization}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    hitSlop={8}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  {item.location ? (
                    <View style={styles.metaItem}>
                      <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                  {item.job_type ? (
                    <View style={styles.metaItem}>
                      <Feather name="briefcase" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {item.job_type}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Bottom row: status + applied date */}
                <View style={styles.cardBottom}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Feather name={statusStyle.icon as any} size={11} color={statusStyle.text} />
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status}
                    </Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Feather name="clock" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                      {timeSince(item.applied_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3, fontWeight: "600" },
  countBadge:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  countText:   { color: "#fff", fontSize: 16, fontWeight: "900" },
  statsStrip:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statChipText:{ fontSize: 11, fontWeight: "800" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },

  listContent: { padding: 16, gap: 12 },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTop:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  orgLogo:      { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  orgInitial:   { fontSize: 20, fontWeight: "900" },
  cardTitle:    { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  cardOrg:      { fontSize: 12, fontWeight: "600" },
  deleteBtn:    { padding: 4 },

  metaRow:      { flexDirection: "row", gap: 16, flexWrap: "wrap", marginBottom: 12 },
  metaItem:     { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText:     { fontSize: 12, fontWeight: "600" },

  cardBottom:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: "800" },
  dateRow:      { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText:     { fontSize: 11, fontWeight: "600" },

  emptyState:   { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  emptyTitle:   { fontSize: 20, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  emptySub:     { fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 28 },
  findBtn:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, elevation: 3 },
  findBtnText:  { color: "#fff", fontWeight: "800", fontSize: 15 },
});
