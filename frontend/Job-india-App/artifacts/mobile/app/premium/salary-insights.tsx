import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/context/SubscriptionContext";

const CATEGORIES = ["All", "Tech", "Government", "Finance", "Healthcare", "Management"];

const INSIGHTS: Record<string, { role: string; avg: string; top: string; trend: "up" | "stable" | "down"; yoy: string; category: string }[]> = {
  All: [],
  Tech: [
    { role: "Software Engineer", avg: "₹12L", top: "₹28L", trend: "up", yoy: "+18%", category: "Tech" },
    { role: "Senior Developer", avg: "₹20L", top: "₹45L", trend: "up", yoy: "+22%", category: "Tech" },
    { role: "Data Scientist", avg: "₹15L", top: "₹35L", trend: "up", yoy: "+15%", category: "Tech" },
    { role: "AI/ML Engineer", avg: "₹22L", top: "₹60L", trend: "up", yoy: "+35%", category: "Tech" },
    { role: "UI/UX Designer", avg: "₹8L", top: "₹20L", trend: "up", yoy: "+12%", category: "Tech" },
    { role: "DevOps Engineer", avg: "₹18L", top: "₹38L", trend: "up", yoy: "+20%", category: "Tech" },
    { role: "Cybersecurity Analyst", avg: "₹14L", top: "₹32L", trend: "up", yoy: "+25%", category: "Tech" },
  ],
  Government: [
    { role: "IAS Officer", avg: "₹14L", top: "₹22L", trend: "stable", yoy: "+5%", category: "Government" },
    { role: "IPS Officer", avg: "₹13L", top: "₹20L", trend: "stable", yoy: "+5%", category: "Government" },
    { role: "SSC CGL (Grade B)", avg: "₹7L", top: "₹12L", trend: "stable", yoy: "+6%", category: "Government" },
    { role: "Bank PO (SBI/IBPS)", avg: "₹9L", top: "₹15L", trend: "up", yoy: "+8%", category: "Government" },
    { role: "Defence Officer", avg: "₹11L", top: "₹18L", trend: "up", yoy: "+10%", category: "Government" },
    { role: "Railway Engineer", avg: "₹8L", top: "₹14L", trend: "stable", yoy: "+6%", category: "Government" },
  ],
  Finance: [
    { role: "Investment Banker", avg: "₹25L", top: "₹80L", trend: "up", yoy: "+20%", category: "Finance" },
    { role: "Chartered Accountant", avg: "₹12L", top: "₹30L", trend: "up", yoy: "+14%", category: "Finance" },
    { role: "Financial Analyst", avg: "₹10L", top: "₹24L", trend: "up", yoy: "+12%", category: "Finance" },
    { role: "Risk Manager", avg: "₹18L", top: "₹40L", trend: "stable", yoy: "+8%", category: "Finance" },
  ],
  Healthcare: [
    { role: "MBBS Doctor", avg: "₹10L", top: "₹50L", trend: "up", yoy: "+15%", category: "Healthcare" },
    { role: "Specialist Doctor", avg: "₹30L", top: "₹1.2Cr", trend: "up", yoy: "+18%", category: "Healthcare" },
    { role: "Nurse (Senior)", avg: "₹5L", top: "₹12L", trend: "up", yoy: "+10%", category: "Healthcare" },
    { role: "Healthcare Manager", avg: "₹14L", top: "₹28L", trend: "up", yoy: "+12%", category: "Healthcare" },
  ],
  Management: [
    { role: "Product Manager", avg: "₹18L", top: "₹45L", trend: "up", yoy: "+20%", category: "Management" },
    { role: "MBA Manager", avg: "₹15L", top: "₹35L", trend: "up", yoy: "+16%", category: "Management" },
    { role: "Operations Manager", avg: "₹12L", top: "₹25L", trend: "stable", yoy: "+8%", category: "Management" },
    { role: "HR Manager", avg: "₹10L", top: "₹22L", trend: "up", yoy: "+10%", category: "Management" },
  ],
};
INSIGHTS.All = Object.values(INSIGHTS).flat().filter((_, i) => i % 2 === 0).slice(0, 8);

const trendColor = (t: string) => t === "up" ? "#10b981" : t === "down" ? "#ef4444" : "#f59e0b";
const trendIcon = (t: string): any => t === "up" ? "trending-up" : t === "down" ? "trending-down" : "minus";

export default function SalaryInsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useSubscription();
  const [activeCategory, setActiveCategory] = useState("All");

  if (!subscription.isActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salary Benchmark 2025</Text>
        </View>
        <View style={styles.gateWrap}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Upgrade to Pro to see detailed salary data across all industries and roles.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push("/(tabs)/premium" as any)}>
            <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.upgradeBtnGrad}>
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const data = INSIGHTS[activeCategory] || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0F172A", "#1E3A8A"]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Salary Benchmark 2025</Text>
          <Text style={styles.headerSub}>India Market Data</Text>
        </View>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={styles.tabs}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, activeCategory === cat && styles.tabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Based on 2025 India market data. CTC includes all components.
        </Text>
        {data.map((item, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.role, { color: colors.foreground }]}>{item.role}</Text>
              <View style={[styles.yoyBadge, { backgroundColor: trendColor(item.trend) + "15" }]}>
                <Feather name={trendIcon(item.trend)} size={11} color={trendColor(item.trend)} />
                <Text style={[styles.yoyText, { color: trendColor(item.trend) }]}>{item.yoy}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Average CTC</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{item.avg}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Top 10%</Text>
                <Text style={[styles.statValue, { color: "#10b981" }]}>{item.top}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>YoY Growth</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Feather name={trendIcon(item.trend)} size={13} color={trendColor(item.trend)} />
                  <Text style={[styles.statValue, { color: trendColor(item.trend) }]}>{item.yoy}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  proBadge: { backgroundColor: "#fbbf2430", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: "#fbbf2460" },
  proBadgeText: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9" },
  tabActive: { backgroundColor: "#1E3A8A" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },
  scroll: { padding: 16, gap: 12 },
  disclaimer: { fontSize: 11, marginBottom: 4, fontStyle: "italic" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  role: { fontSize: 15, fontWeight: "700", flex: 1 },
  yoyBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  yoyText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statBox: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: "800" },
  divider: { width: 1, height: 36, marginHorizontal: 8 },
  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  gateTitle: { fontSize: 22, fontWeight: "800" },
  gateSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  upgradeBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  upgradeBtnGrad: { paddingVertical: 14, paddingHorizontal: 28, alignItems: "center" },
  upgradeBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
