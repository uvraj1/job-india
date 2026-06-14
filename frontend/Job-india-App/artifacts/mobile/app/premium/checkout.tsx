import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { processPayment } from "@/utils/paymentService";
import { useSubscription } from "@/context/SubscriptionContext";

import { useAuth } from "@/context/AuthContext";

const PLANS = {
// ...
  monthly: { title: "Monthly Pro", price: "₹499", amount: 499, period: "per month", saving: null },
  yearly: { title: "Annual Pro", price: "₹3,999", amount: 3999, period: "per year", saving: "Save ₹2,000 vs monthly" },
} as const;

type PlanId = keyof typeof PLANS;
type PayMethod = "upi" | "netbanking" | "card";

const UPI_APPS = [
  { id: "gpay", label: "Google Pay", icon: "smartphone" },
  { id: "phonepe", label: "PhonePe", icon: "smartphone" },
  { id: "paytm", label: "Paytm", icon: "smartphone" },
  { id: "other", label: "Other UPI", icon: "link" },
];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    planParam === "monthly" ? "monthly" : "yearly"
  );
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "success">("select");
  const [txnId, setTxnId] = useState("");
  const { updateSubscription } = useSubscription();
  const { user } = useAuth();

  const plan = useMemo(() => PLANS[selectedPlan], [selectedPlan]);

  const handlePay = async () => {
    if (payMethod === "upi" && !upiId.trim()) {
      return;
    }
    setStep("processing");
    setProcessing(true);
    try {
      const result = await processPayment({
        amount: plan.amount,
        planId: selectedPlan,
        planTitle: plan.title,
        upiId: upiId.trim() || undefined,
        paymentMethod: payMethod,
        userId: user?.id,
      });
      if (result.success) {
        await updateSubscription(selectedPlan, result.transactionId);
        setTxnId(result.transactionId || "");
        setStep("success");
      }
    } catch {
      setStep("confirm");
    } finally {
      setProcessing(false);
    }
  };

  if (step === "success") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successWrap}>
          <LinearGradient colors={["#10b981", "#059669"]} style={styles.successIcon}>
            <Feather name="check" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Welcome to Pro! 🎉
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            {plan.title} activated successfully. Enjoy all Pro benefits!
          </Text>
          {txnId ? (
            <View style={[styles.txnBox, { backgroundColor: colors.muted }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Transaction ID</Text>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>{txnId}</Text>
            </View>
          ) : null}
          <View style={styles.proFeatures}>
            {[
              "AI Resume Optimization",
              "Salary Benchmark Insights",
              "Direct HR Messaging",
              "Instant Interview Calls",
              "10x Profile Visibility",
              "Verified Pro Badge",
              "Early Access to Jobs",
            ].map((f) => (
              <View key={f} style={styles.proFeatureRow}>
                <Feather name="check-circle" size={15} color="#10b981" />
                <Text style={[styles.proFeatureText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace("/(tabs)/premium" as any)}
          >
            <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.doneBtnGrad}>
              <Text style={styles.doneBtnText}>Start Using Pro</Text>
              <Feather name="arrow-right" size={16} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step === "confirm" ? setStep("select") : router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "confirm" ? "Confirm Payment" : "Choose Your Plan"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {step === "select" && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Select Plan</Text>
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const item = PLANS[id];
              const active = selectedPlan === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.planCard, {
                    backgroundColor: active ? "#1E3A8A10" : colors.card,
                    borderColor: active ? "#1E3A8A" : colors.border,
                  }]}
                  onPress={() => setSelectedPlan(id)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.foreground }]}>{item.title}</Text>
                    {item.saving && (
                      <Text style={{ fontSize: 12, color: "#10b981", fontWeight: "600", marginTop: 2 }}>{item.saving}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.planPrice, { color: colors.foreground }]}>{item.price}</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{item.period}</Text>
                  </View>
                  {active && (
                    <View style={styles.activeDot}>
                      <Feather name="check-circle" size={20} color="#1E3A8A" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Payment Method
            </Text>
            {(["upi", "netbanking", "card"] as PayMethod[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodCard, {
                  backgroundColor: payMethod === m ? "#1E3A8A10" : colors.card,
                  borderColor: payMethod === m ? "#1E3A8A" : colors.border,
                }]}
                onPress={() => setPayMethod(m)}
                activeOpacity={0.85}
              >
                <Feather
                  name={m === "upi" ? "smartphone" : m === "card" ? "credit-card" : "globe"}
                  size={20}
                  color={payMethod === m ? "#1E3A8A" : colors.mutedForeground}
                />
                <Text style={[styles.methodText, { color: colors.foreground }]}>
                  {m === "upi" ? "UPI / QR" : m === "netbanking" ? "Net Banking" : "Debit / Credit Card"}
                </Text>
                {payMethod === m && <View style={{ flex: 1, alignItems: "flex-end" }}><Feather name="check-circle" size={18} color="#1E3A8A" /></View>}
              </TouchableOpacity>
            ))}

            {payMethod === "upi" && (
              <View style={[styles.upiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.upiLabel, { color: colors.foreground }]}>Enter UPI ID</Text>
                <TextInput
                  style={[styles.upiInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="yourname@upi"
                  placeholderTextColor={colors.mutedForeground}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={[styles.upiHint, { color: colors.mutedForeground }]}>
                  e.g. 9876543210@ybl, name@okicici
                </Text>
              </View>
            )}

            {payMethod === "card" && (
              <View style={[styles.upiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.upiLabel, { color: colors.foreground }]}>Card Details</Text>
                <TextInput
                  style={[styles.upiInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Card Number"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={19}
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TextInput
                    style={[styles.upiInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={5}
                  />
                  <TextInput
                    style={[styles.upiInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="CVV"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry
                    maxLength={3}
                  />
                </View>
              </View>
            )}

            {payMethod === "netbanking" && (
              <View style={[styles.upiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.upiLabel, { color: colors.foreground }]}>Select Bank</Text>
                {["SBI", "HDFC", "ICICI", "Axis Bank", "Other"].map((bank) => (
                  <TouchableOpacity key={bank} style={[styles.bankRow, { borderColor: colors.border }]}>
                    <Feather name="credit-card" size={16} color={colors.mutedForeground} />
                    <Text style={{ color: colors.foreground, flex: 1, marginLeft: 10 }}>{bank}</Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.proceedBtn, { opacity: payMethod === "upi" && !upiId.trim() ? 0.5 : 1 }]}
              onPress={() => setStep("confirm")}
              disabled={payMethod === "upi" && !upiId.trim()}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.proceedGrad}>
                <Text style={styles.proceedText}>Proceed to Pay {plan.price}</Text>
                <Feather name="arrow-right" size={16} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === "confirm" && (
          <>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.mutedForeground }}>Plan</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>{plan.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.mutedForeground }}>Validity</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>{plan.period}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.mutedForeground }}>Payment</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                  {payMethod === "upi" ? `UPI (${upiId})` : payMethod === "card" ? "Card" : "Net Banking"}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Total</Text>
                <Text style={{ color: "#10b981", fontWeight: "900", fontSize: 22 }}>{plan.price}</Text>
              </View>
            </View>

            <View style={[styles.secureBox, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
              <Feather name="shield" size={16} color="#16a34a" />
              <Text style={{ color: "#16a34a", fontSize: 13, flex: 1 }}>
                100% Secure. Encrypted payment. No auto-renewal without your consent.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.proceedBtn}
              onPress={handlePay}
              disabled={processing}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.proceedGrad}>
                {processing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Feather name="lock" size={16} color="#000" />
                    <Text style={styles.proceedText}>Confirm & Pay {plan.price}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === "processing" && (
          <View style={styles.processingWrap}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={[styles.processingText, { color: colors.foreground }]}>
              Processing your payment...
            </Text>
            <Text style={[styles.processingSub, { color: colors.mutedForeground }]}>
              Please do not close the app
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F172A",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  scroll: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  planCard: { borderWidth: 2, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  planTitle: { fontSize: 16, fontWeight: "700" },
  planPrice: { fontSize: 18, fontWeight: "800" },
  activeDot: { marginLeft: 8 },
  methodCard: { borderWidth: 1.5, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  methodText: { fontSize: 15, fontWeight: "600" },
  upiBox: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  upiLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  upiInput: { borderWidth: 1, borderRadius: 10, padding: Platform.OS === "web" ? 10 : 12, fontSize: 15 },
  upiHint: { fontSize: 12 },
  bankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  proceedBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  proceedGrad: { paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 },
  proceedText: { color: "#000", fontSize: 16, fontWeight: "800" },
  summaryCard: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 },
  summaryTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 14, marginTop: 4 },
  secureBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  processingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 16 },
  processingText: { fontSize: 18, fontWeight: "700" },
  processingSub: { fontSize: 14 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  successTitle: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  successSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  txnBox: { borderRadius: 10, padding: 14, alignItems: "center", gap: 4, width: "100%" },
  proFeatures: { width: "100%", gap: 10, marginTop: 8 },
  proFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  proFeatureText: { fontSize: 14, fontWeight: "500" },
  doneBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8, width: "100%" },
  doneBtnGrad: { paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 },
  doneBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
