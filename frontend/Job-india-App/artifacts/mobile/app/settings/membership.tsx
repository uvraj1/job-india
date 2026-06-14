/**
 * Settings → Membership Management Screen
 *
 * Dedicated screen for managing premium membership:
 *  - Current plan status (Active / Free)
 *  - Plan details card (type, expiry, activated on)
 *  - Features list (what you get / what you lose)
 *  - Upgrade / Change Plan button (Free users)
 *  - Cancel Subscription button (Pro users) — routes to tricky cancel flow
 */

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useSubscription } from "@/context/SubscriptionContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// ─── Plan Benefits ──────────────────────────────────────────────────────────
const PRO_FEATURES = [
  { icon: "mic",           color: "#a78bfa", label: "AI Mock Interview Coach" },
  { icon: "file-text",     color: "#10b981", label: "AI Resume Optimizer" },
  { icon: "trending-up",   color: "#3b82f6", label: "Salary Benchmark Insights" },
  { icon: "message-circle",color: "#8b5cf6", label: "Direct HR Messaging" },
  { icon: "zap",           color: "#fbbf24", label: "Priority Interview Calls" },
  { icon: "eye",           color: "#ec4899", label: "10× Profile Visibility" },
  { icon: "shield",        color: "#f59e0b", label: "Verified Pro Badge" },
  { icon: "clock",         color: "#06b6d4", label: "24h Early Job Access" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(iso?: string) {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MembershipScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 24 : insets.top;
  const { subscription, loading, cancelSubscription, updateSubscription } = useSubscription();

  const isActive  = subscription.isActive;
  const planLabel = subscription.planType === "yearly" ? "Yearly Pro" : "Monthly Pro";
  const days      = daysLeft(subscription.expiryDate);

  // ── Cancel handler ──────────────────────────────────────────────────────
  const handleCancel = () => {
    router.push("/premium/cancel-subscription" as any);
  };

  // ── Upgrade handler ──────────────────────────────────────────────────────
  const handleUpgrade = () => {
    router.push("/(tabs)/premium" as any);
  };

  // ── Change Plan (yearly → monthly or vice-versa) ─────────────────────────
  const handleChangePlan = () => {
    const next = subscription.planType === "yearly" ? "monthly" : "yearly";
    const label = next === "yearly" ? "Yearly (₹999/yr)" : "Monthly (₹99/mo)";
    Alert.alert(
      "Plan Badlein?",
      `Aap ${label} plan pe switch karna chahte hain?`,
      [
        { text: "Nahi", style: "cancel" },
        {
          text: "Haan, Switch Karo",
          onPress: async () => {
            await updateSubscription(next);
            Alert.alert("✅ Plan Updated!", `Aap ab ${label} plan pe hain.`);
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={isActive ? ["#78350F", "#B45309", "#D97706"] : ["#1E293B", "#334155"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Membership Management</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Status pill */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.heroPill}>
          <Feather name={isActive ? "star" : "lock"} size={28} color={isActive ? "#FDE68A" : "#94A3B8"} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroStatus}>
              {isActive ? `✨ ${planLabel}` : "Free Plan"}
            </Text>
            <Text style={styles.heroSub}>
              {isActive
                ? `${days} din baaki • ${fmtDate(subscription.expiryDate)} tak`
                : "Upgrade karein — Premium features unlock honge"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? "#FDE68A" : "#475569" }]}>
            <Text style={[styles.statusBadgeText, { color: isActive ? "#78350F" : "#fff" }]}>
              {isActive ? "ACTIVE" : "FREE"}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Plan Details Card (only for Pro) ── */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#D97706" }]}>
              <View style={styles.cardHeader}>
                <Feather name="credit-card" size={16} color="#D97706" />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Plan Details</Text>
              </View>

              <View style={styles.detailGrid}>
                <DetailRow
                  label="Plan"
                  value={planLabel}
                  icon="award"
                  iconColor="#D97706"
                  colors={colors}
                />
                <DetailRow
                  label="Status"
                  value="Active ✅"
                  icon="check-circle"
                  iconColor="#10b981"
                  colors={colors}
                />
                <DetailRow
                  label="Activated On"
                  value={fmtDate(subscription.activatedAt)}
                  icon="calendar"
                  iconColor="#6366f1"
                  colors={colors}
                />
                <DetailRow
                  label="Valid Until"
                  value={fmtDate(subscription.expiryDate)}
                  icon="clock"
                  iconColor="#f59e0b"
                  colors={colors}
                />
                <DetailRow
                  label="Days Remaining"
                  value={`${days} din`}
                  icon="activity"
                  iconColor={days < 7 ? "#ef4444" : "#10b981"}
                  colors={colors}
                />
                {subscription.transactionId && (
                  <DetailRow
                    label="Transaction ID"
                    value={subscription.transactionId.slice(0, 20) + (subscription.transactionId.length > 20 ? "…" : "")}
                    icon="hash"
                    iconColor="#8b5cf6"
                    colors={colors}
                  />
                )}
              </View>

              {/* Days bar */}
              {days > 0 && (
                <View style={styles.daysBarWrap}>
                  <View style={[styles.daysBarTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.daysBarFill,
                        {
                          width: `${Math.min(100, (days / (subscription.planType === "yearly" ? 365 : 30)) * 100)}%`,
                          backgroundColor: days < 7 ? "#ef4444" : "#D97706",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.daysBarLabel, { color: colors.mutedForeground }]}>
                    {days < 7 ? "⚠️ Renew karo jaldi!" : "Subscription valid hai"}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Features List ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="zap" size={16} color={isActive ? "#D97706" : colors.mutedForeground} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {isActive ? "Aapke Pro Benefits" : "Pro mein kya milega?"}
              </Text>
            </View>

            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + "15" }]}>
                  <Feather name={f.icon as any} size={15} color={f.color} />
                </View>
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                <Feather
                  name={isActive ? "check" : "lock"}
                  size={14}
                  color={isActive ? "#10b981" : colors.mutedForeground}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Action Buttons ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.actionsBlock}>

          {isActive ? (
            <>
              {/* Change Plan */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: "#D97706", borderWidth: 1.5 }]}
                onPress={handleChangePlan}
                activeOpacity={0.85}
              >
                <Feather name="refresh-cw" size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionBtnLabel, { color: colors.foreground }]}>Plan Badlein</Text>
                  <Text style={[styles.actionBtnSub, { color: colors.mutedForeground }]}>
                    {subscription.planType === "yearly"
                      ? "Yearly → Monthly (₹99/mo)"
                      : "Monthly → Yearly (₹999/yr)"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#D97706" />
              </TouchableOpacity>

              {/* Renew Now */}
              <TouchableOpacity
                style={[styles.actionBtn, { overflow: "hidden", padding: 0 }]}
                onPress={handleUpgrade}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#B45309", "#D97706"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  <Feather name="rotate-cw" size={18} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionBtnLabel, { color: "#fff" }]}>Abhi Renew Karo</Text>
                    <Text style={[styles.actionBtnSub, { color: "rgba(255,255,255,0.8)" }]}>
                      Subscription extend karein
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel — danger zone */}
              <View style={[styles.dangerZone, { borderColor: "#ef4444" + "40" }]}>
                <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
                <Text style={[styles.dangerSub, { color: colors.mutedForeground }]}>
                  Cancel karne ke baad aapka Pro access {fmtDate(subscription.expiryDate)} tak rahega, phir Free plan pe aa jayenge.
                </Text>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  activeOpacity={0.85}
                >
                  <Feather name="x-circle" size={16} color="#ef4444" />
                  <Text style={styles.cancelBtnText}>Subscription Cancel Karo</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Upgrade CTA */}
              <TouchableOpacity
                style={[styles.actionBtn, { overflow: "hidden", padding: 0 }]}
                onPress={handleUpgrade}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#B45309", "#F59E0B"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  <Feather name="star" size={20} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionBtnLabel, { color: "#fff", fontSize: 17 }]}>Pro Upgrade Karo</Text>
                    <Text style={[styles.actionBtnSub, { color: "rgba(255,255,255,0.9)" }]}>
                      Monthly ₹99 • Yearly ₹999 (2 months free)
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Compare plans */}
              <View style={[styles.compareBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.compareTitle, { color: colors.foreground }]}>Plans Compare Karein</Text>
                <View style={styles.compareRow}>
                  <View style={[styles.planCol, { borderColor: colors.border }]}>
                    <Text style={[styles.planName, { color: colors.mutedForeground }]}>Free</Text>
                    <Text style={[styles.planPrice, { color: colors.foreground }]}>₹0</Text>
                    <Text style={styles.planPer}>forever</Text>
                    {["Basic job search", "Limited filters", "5 applies/day"].map((f, i) => (
                      <View key={i} style={styles.planFeatureRow}>
                        <Feather name="check" size={12} color="#10b981" />
                        <Text style={[styles.planFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
                      </View>
                    ))}
                    {["AI tools", "HR Messaging", "Priority access"].map((f, i) => (
                      <View key={i} style={styles.planFeatureRow}>
                        <Feather name="x" size={12} color="#ef4444" />
                        <Text style={[styles.planFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.planCol, { borderColor: "#D97706", borderWidth: 2, backgroundColor: "#FEF3C710" }]}>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>BEST</Text>
                    </View>
                    <Text style={[styles.planName, { color: "#D97706" }]}>Pro</Text>
                    <Text style={[styles.planPrice, { color: "#D97706" }]}>₹99</Text>
                    <Text style={styles.planPer}>per month</Text>
                    {["Unlimited search", "All 8 Pro features", "AI Tools + HR Chat", "Priority calls", "Verified badge"].map((f, i) => (
                      <View key={i} style={styles.planFeatureRow}>
                        <Feather name="check" size={12} color="#D97706" />
                        <Text style={[styles.planFeatureText, { color: colors.foreground }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-component: Detail Row ───────────────────────────────────────────────
function DetailRow({ label, value, icon, iconColor, colors }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: iconColor + "15" }]}>
        <Feather name={icon} size={13} color={iconColor} />
      </View>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, padding: 16,
  },
  heroStatus: { fontSize: 18, fontWeight: "900", color: "#fff" },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3, lineHeight: 17 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  scroll: { padding: 16, gap: 14 },

  card: {
    borderRadius: 20, borderWidth: 1, padding: 16,
    elevation: 2, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "800" },

  // Detail grid
  detailGrid: { gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  detailLabel: { flex: 1, fontSize: 13, fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "700" },

  // Days bar
  daysBarWrap: { marginTop: 16 },
  daysBarTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  daysBarFill: { height: "100%", borderRadius: 3 },
  daysBarLabel: { fontSize: 11, fontWeight: "600" },

  // Features
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(128,128,128,0.1)",
  },
  featureIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  featureLabel: { flex: 1, fontSize: 13, fontWeight: "600" },

  // Actions
  actionsBlock: { gap: 12 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  actionBtnGrad: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 16,
  },
  actionBtnLabel: { fontSize: 15, fontWeight: "800" },
  actionBtnSub: { fontSize: 12, marginTop: 2 },

  // Danger zone
  dangerZone: {
    borderWidth: 1.5, borderRadius: 16, padding: 16,
  },
  dangerTitle: { fontSize: 14, fontWeight: "800", color: "#ef4444", marginBottom: 6 },
  dangerSub: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: "#ef4444",
    borderRadius: 12, paddingVertical: 12,
  },
  cancelBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "800" },

  // Compare
  compareBox: { borderWidth: 1, borderRadius: 16, padding: 16 },
  compareTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  compareRow: { flexDirection: "row", gap: 10 },
  planCol: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 12,
    alignItems: "center", position: "relative",
  },
  planName: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
  planPrice: { fontSize: 24, fontWeight: "900" },
  planPer: { fontSize: 10, color: "#94a3b8", marginBottom: 10 },
  planFeatureRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4, alignSelf: "flex-start" },
  planFeatureText: { fontSize: 11 },
  recommendedBadge: {
    position: "absolute", top: -10, right: 10,
    backgroundColor: "#D97706", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  recommendedText: { color: "#fff", fontSize: 9, fontWeight: "900" },
});
