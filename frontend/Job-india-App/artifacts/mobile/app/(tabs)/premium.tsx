import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSubscription } from "@/context/SubscriptionContext";

const PLANS = [
  { id: "monthly", title: "Monthly", price: "₹499", period: "/ month", savings: null },
  { id: "yearly", title: "Annual Pro", price: "₹3,999", period: "/ year", savings: "Save 33%", popular: true },
];

const PRO_FEATURES = [
  { icon: "mic", title: "AI Mock Interview Coach", desc: "Interactive mock panels with instant score & perfect exemplars.", color: "#a78bfa", route: "/premium/mock-interview" },
  { icon: "file-text", title: "AI Resume Optimization", desc: "Get AI-powered tips to make your CV stand out.", color: "#10b981", route: "/premium/resume-analyzer" },
  { icon: "trending-up", title: "Salary Benchmark Insights", desc: "See how much you should be earning in 2025.", color: "#3b82f6", route: "/premium/salary-insights" },
  { icon: "message-circle", title: "Direct Message to HRs", desc: "Skip the queue and chat directly with decision makers.", color: "#8b5cf6", route: "/premium/hr-chat" },
  { icon: "zap", title: "Instant Interview Calls", desc: "Priority screening — HRs reach out to you first.", color: "#fbbf24", route: null },
  { icon: "eye", title: "10x Profile Visibility", desc: "Your profile shown 10x more to recruiters.", color: "#ec4899", route: null },
  { icon: "shield", title: "Verified Pro Badge", desc: "A gold badge on your profile builds trust.", color: "#f59e0b", route: null },
  { icon: "clock", title: "Early Access to New Jobs", desc: "See new postings 24 hours before everyone else.", color: "#06b6d4", route: null },
];

export default function PremiumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">("yearly");
  const { subscription } = useSubscription();
  const isActive = subscription.isActive;

  const expiryStr = subscription.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const handleManage = () => {
    Alert.alert(
      "Subscription Manage",
      "Aap apna Pro subscription cancel karna chahte hain?",
      [
        { text: "Nahi, Pro Rakhna Hai! 💪", style: "cancel" },
        {
          text: "Cancel Process Shuru Karo",
          style: "destructive",
          onPress: () => router.push("/premium/cancel-subscription" as any),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="#0F172A" translucent={true} />
      <View style={{ height: topPad, backgroundColor: "#0F172A", width: "100%", zIndex: 10, position: "absolute", top: 0 }} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#0F172A", "#1E3A8A"]}
          style={[styles.header, { paddingTop: topPad + 12, marginHorizontal: -20, marginBottom: 20 }]}
        >
          {isActive ? (
            <View style={styles.activeHeaderContent}>
              <View style={styles.proBadgeWrap}>
                <Feather name="award" size={18} color="#fbbf24" />
                <Text style={styles.proBadgeText}>PRO ACTIVE</Text>
              </View>
              <Text style={styles.headerTitle}>You're a Pro Member!</Text>
              <Text style={styles.headerSubtitle}>
                {subscription.planType === "yearly" ? "Annual" : "Monthly"} Plan
                {expiryStr ? ` • Renews ${expiryStr}` : ""}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.headerTitle}>Job India Pro</Text>
              <Text style={styles.headerSubtitle}>Everything you need to land your dream job faster.</Text>
            </View>
          )}
        </LinearGradient>

        {isActive ? (
          <View style={[styles.activeCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
            <View style={styles.activeRow}>
              <View style={[styles.greenDot]} />
              <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 15 }}>
                Pro Subscription Active
              </Text>
            </View>
            <Text style={{ color: "#15803d", fontSize: 13, marginTop: 4 }}>
              All Pro features are unlocked. Expires {expiryStr}.
            </Text>
            <TouchableOpacity style={styles.manageBtn} onPress={handleManage}>
              <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 13 }}>Manage / Cancel Subscription</Text>
              <Feather name="chevron-right" size={14} color="#16a34a" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.planContainer}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedPlan === plan.id ? "#fbbf24" : plan.popular ? "#fbbf24" : colors.border,
                  },
                ]}
                onPress={() => setSelectedPlan(plan.id as "monthly" | "yearly")}
                activeOpacity={0.85}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <Text style={[styles.planTitle, { color: colors.foreground }]}>{plan.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: colors.foreground }]}>{plan.price}</Text>
                  <Text style={[styles.period, { color: colors.mutedForeground }]}>{plan.period}</Text>
                </View>
                {plan.savings && <Text style={styles.savingsText}>{plan.savings}</Text>}
                {selectedPlan === plan.id && (
                  <Feather name="check-circle" size={16} color="#fbbf24" style={{ marginTop: 8 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pro Benefits</Text>
          {PRO_FEATURES.map((f) => (
            <TouchableOpacity
              key={f.title}
              onPress={() => f.route ? router.push(f.route as any) : null}
              activeOpacity={f.route ? 0.7 : 1}
            >
              <View style={[styles.featureItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: f.color + "18" }]}>
                  <Feather name={f.icon as any} size={18} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
                </View>
                {f.route ? (
                  <Feather name={isActive ? "chevron-right" : "lock"} size={16} color={isActive ? f.color : colors.mutedForeground} />
                ) : (
                  isActive ? <Feather name="check-circle" size={16} color="#10b981" /> : <Feather name="lock" size={14} color={colors.mutedForeground} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!isActive && (
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => router.push({ pathname: "/premium/checkout", params: { plan: selectedPlan } } as any)}
          >
            <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.btnGradient}>
              <Text style={styles.btnText}>Start My Pro Journey →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!isActive && (
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Cancel anytime. No hidden charges. Secure payment via UPI / Card.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  activeHeaderContent: { gap: 8 },
  proBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(251,191,36,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
  proBadgeText: { color: "#fbbf24", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  scroll: { padding: 16 },
  activeCard: { borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 24 },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  planContainer: { flexDirection: "column", gap: 10, marginBottom: 24 },
  planCard: { padding: 14, borderRadius: 16, borderWidth: 2, alignItems: "flex-start" },
  popularBadge: { position: "absolute", top: -10, right: 14, backgroundColor: "#fbbf24", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  popularText: { fontSize: 10, fontWeight: "900", color: "#000" },
  planTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  price: { fontSize: 22, fontWeight: "800" },
  period: { fontSize: 12, marginLeft: 2 },
  savingsText: { fontSize: 12, color: "#10b981", fontWeight: "700", marginTop: 3 },
  featuresSection: { gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  featureItem: { flexDirection: "row", gap: 12, alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  featureTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  featureDesc: { fontSize: 12, lineHeight: 17 },
  mainBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#000", fontSize: 15, fontWeight: "800" },
  disclaimer: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
