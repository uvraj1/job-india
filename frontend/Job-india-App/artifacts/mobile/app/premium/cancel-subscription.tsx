/**
 * CancelSubscriptionScreen
 *
 * "Tricky" 4-step cancellation funnel:
 *  Step 1 – Loss anchoring  (ye sab chhutt jayega)
 *  Step 2 – Retention offer (1 month free ya 50% discount)
 *  Step 3 – Typed confirmation ("CANCEL" likhna padega)
 *  Step 4 – 5-second countdown before final cancel
 */

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
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
import { useSubscription } from "@/context/SubscriptionContext";

// ─── Constants ──────────────────────────────────────────────────────────────
const CONFIRM_WORD = "CANCEL";

const LOSING = [
  { icon: "mic",          color: "#a78bfa", title: "AI Mock Interview Coach",       desc: "Real interview prep bhi khatam ho jaega" },
  { icon: "file-text",    color: "#10b981", title: "AI Resume Optimizer",            desc: "Recruiter-ready CV tips milne band ho jayenge" },
  { icon: "trending-up",  color: "#3b82f6", title: "Salary Benchmark Insights",      desc: "Market salary data access nahi rahega" },
  { icon: "message-circle",color:"#8b5cf6", title: "Direct HR Messaging",            desc: "HR inbox access lock ho jaega" },
  { icon: "zap",          color: "#fbbf24", title: "Priority Interview Calls",        desc: "Pehle wali queue mein wapis jana hoga" },
  { icon: "eye",          color: "#ec4899", title: "10× Profile Visibility",          desc: "Recruiters aapko kam dekhenge" },
  { icon: "shield",       color: "#f59e0b", title: "Verified Pro Badge",              desc: "Trust badge hat jaega profile se" },
  { icon: "clock",        color: "#06b6d4", title: "Early Job Access (24h Ahead)",   desc: "Late access → job miss hone ka risk" },
];

const RETENTION_OFFERS = [
  { id: "pause",    icon: "pause-circle", color: "#6366f1", label: "Subscription 1 Month Pause Karo",   sublabel: "Break lo, cancel mat karo. Free mein!",              cta: "Pause Karo — Free",   ctaColor: "#6366f1" },
  { id: "discount", icon: "tag",          color: "#10b981", label: "50% Discount — Sirf Aapke Liye",    sublabel: "Next 3 months half price mein mile. Limited offer.", cta: "50% Deal Accept Karo", ctaColor: "#10b981" },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CancelSubscriptionScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 24 : insets.top;
  const { subscription, cancelSubscription } = useSubscription();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [typed, setTyped]         = useState("");
  const [countdown, setCountdown] = useState(5);
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone]           = useState(false);

  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Shake animation for wrong input ──────────────────────────────────────
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ─── Step 4: countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 4) return;
    setCountdown(5);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          executeCancellation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);

  const executeCancellation = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      setDone(true);
    } catch {
      Alert.alert("Error", "Cancel nahi ho paya. Dobara try karein.");
      router.back();
    } finally {
      setCancelling(false);
    }
  };

  const abortCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    router.back();
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const handleRetentionAccept = (offerId: string) => {
    Alert.alert(
      offerId === "pause" ? "Subscription Paused! ✅" : "Discount Applied! 🎉",
      offerId === "pause"
        ? "Aapka subscription 1 mahine ke liye pause ho gaya hai. Premium access isi waqt continue rahega."
        : "Agle 3 mahine ka renewal 50% discount pe hoga. Aapka Pro access active hai.",
      [{ text: "Shukria! 🙏", onPress: () => router.back() }]
    );
  };

  const handleStep3Next = () => {
    if (typed.trim().toUpperCase() !== CONFIRM_WORD) {
      shake();
      Alert.alert(
        "Galat Input ❌",
        `Bilkul sahi "CANCEL" likhna hoga (caps mein). Aapne likha: "${typed}"`
      );
      return;
    }
    setStep(4);
  };

  const expiryStr = subscription.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Unknown";

  // ─── DONE screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: topPad, backgroundColor: "#0F172A" }} />
        <View style={styles.doneCenter}>
          <View style={styles.sadIcon}>
            <Text style={{ fontSize: 56 }}>😢</Text>
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>
            Subscription Cancel Ho Gaya
          </Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Aapka Pro access {expiryStr} tak rahega. Hum aapko yaad karenge!
          </Text>
          <TouchableOpacity
            style={[styles.doneBackBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)/premium")}
          >
            <Text style={styles.doneBackText}>Wapas Jao</Text>
          </TouchableOpacity>

          {/* Re-subscribe temptation */}
          <TouchableOpacity
            style={[styles.resubBtn, { borderColor: "#fbbf24" }]}
            onPress={() => router.replace("/(tabs)/premium")}
          >
            <Feather name="refresh-cw" size={14} color="#fbbf24" />
            <Text style={[styles.resubText, { color: "#fbbf24" }]}>
              Galti Ho Gayi? Wapas Join Karo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      style={[styles.header, { paddingTop: topPad + 10 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => step === 1 ? router.back() : setStep((prev) => (prev - 1) as any)}
          style={styles.backBtn}
          disabled={step === 4}
        >
          <Feather name="arrow-left" size={22} color={step === 4 ? "#555" : "#fff"} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Subscription Cancel</Text>
          <Text style={styles.headerStep}>Step {step} of 4</Text>
        </View>

        <View style={styles.stepDots}>
          {[1,2,3,4].map((s) => (
            <View
              key={s}
              style={[styles.dot, step >= s && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 – Loss Anchoring
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={22} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Ruko! Yeh sab kho denge aap 😟</Text>
              <Text style={styles.warningSub}>Cancel karte hi yeh features immediately lock ho jayenge:</Text>
            </View>
          </View>

          {LOSING.map((item, idx) => (
            <View key={idx} style={[styles.lossCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.lossIcon, { backgroundColor: item.color + "15" }]}>
                <Feather name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lossTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.lossDesc, { color: "#ef4444" }]}>{item.desc}</Text>
              </View>
              <Feather name="x-circle" size={18} color="#ef4444" />
            </View>
          ))}

          <View style={[styles.renewalBox, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
            <Feather name="calendar" size={16} color="#92400e" />
            <Text style={[styles.renewalText, { color: "#92400e" }]}>
              Aapka plan {expiryStr} tak valid hai — abhi cancel karna matlab {" "}
              <Text style={{ fontWeight: "900" }}>paid time waste</Text> karna hai!
            </Text>
          </View>

          {/* CTA row */}
          <TouchableOpacity
            style={[styles.keepBtn]}
            onPress={() => router.back()}
          >
            <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.keepGrad}>
              <Feather name="heart" size={18} color="#000" />
              <Text style={styles.keepText}>Nahi, Pro Rakhna Chahta Hoon!</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueCancel, { borderColor: colors.border }]}
            onPress={() => setStep(2)}
          >
            <Text style={[styles.continueCancelText, { color: colors.mutedForeground }]}>
              Phir bhi cancel karna chahta hoon →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 – Retention Offer
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.retentionHero}>
            <Text style={{ fontSize: 52, textAlign: "center" }}>🎁</Text>
            <Text style={[styles.retTitle, { color: colors.foreground }]}>
              Rukne ke Liye Special Offer!
            </Text>
            <Text style={[styles.retSub, { color: colors.mutedForeground }]}>
              Sirf aapke liye yeh exclusive deals — ek bar sochiye
            </Text>
          </View>

          {RETENTION_OFFERS.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={[styles.offerCard, { backgroundColor: colors.card, borderColor: offer.color }]}
              onPress={() => handleRetentionAccept(offer.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.offerIcon, { backgroundColor: offer.color + "20" }]}>
                <Feather name={offer.icon as any} size={24} color={offer.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.offerLabel, { color: colors.foreground }]}>{offer.label}</Text>
                <Text style={[styles.offerSub, { color: colors.mutedForeground }]}>{offer.sublabel}</Text>
              </View>
              <View style={[styles.offerCta, { backgroundColor: offer.ctaColor }]}>
                <Text style={styles.offerCtaText}>{offer.cta}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Social proof */}
          <View style={[styles.proofBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={16} color="#6366f1" />
            <Text style={[styles.proofText, { color: colors.mutedForeground }]}>
              <Text style={{ color: colors.foreground, fontWeight: "800" }}>94% users</Text>
              {" "}jo pause ya discount lete hain woh Pro mein hi rehte hain 💪
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueCancel, { borderColor: colors.border }]}
            onPress={() => setStep(3)}
          >
            <Text style={[styles.continueCancelText, { color: colors.mutedForeground }]}>
              Koi offer nahi chahiye, cancel hi karna hai →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 – Typed Confirmation
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 3) {
    const isCorrect = typed.trim().toUpperCase() === CONFIRM_WORD;
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {renderHeader()}
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.confirmHero}>
            <Text style={{ fontSize: 48, textAlign: "center" }}>⚠️</Text>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              Ek Aakhri Step
            </Text>
            <Text style={[styles.confirmSub, { color: colors.mutedForeground }]}>
              Hum confirm karna chahte hain ki aap sachchi cancel karna chahte hain.
              Neeche box mein bilkul sahi{" "}
              <Text style={{ color: "#ef4444", fontWeight: "900" }}>CANCEL</Text>
              {" "}type karein (capital letters mein):
            </Text>
          </View>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[
                styles.confirmInput,
                {
                  borderColor: typed.length === 0 ? colors.border : isCorrect ? "#10b981" : "#ef4444",
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }
              ]}
              placeholder='Yahan "CANCEL" likho'
              placeholderTextColor={colors.mutedForeground}
              value={typed}
              onChangeText={setTyped}
              autoCorrect={false}
              autoCapitalize="characters"
              maxLength={10}
            />
          </Animated.View>

          {typed.length > 0 && !isCorrect && (
            <View style={styles.hintRow}>
              <Feather name="x-circle" size={14} color="#ef4444" />
              <Text style={styles.hintText}>
                Exactly "CANCEL" chahiye — "{typed.trim()}" nahi
              </Text>
            </View>
          )}

          {isCorrect && (
            <View style={styles.hintRow}>
              <Feather name="check-circle" size={14} color="#10b981" />
              <Text style={[styles.hintText, { color: "#10b981" }]}>Sahi hai! Aage badho</Text>
            </View>
          )}

          {/* Scary stats */}
          <View style={[styles.scaryBox, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
            <Text style={styles.scaryTitle}>🔴 Cancel karne ke baad:</Text>
            {[
              "📉 Aapka interview call rate 78% gir sakta hai",
              "💼 90 din mein placement chances 3x kam hote hain",
              "👁️ Recruiters aapki profile 10x kam dekhenge",
            ].map((s, i) => (
              <Text key={i} style={styles.scaryItem}>{s}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: isCorrect ? "#ef4444" : "#9ca3af", opacity: isCorrect ? 1 : 0.6 }
            ]}
            onPress={handleStep3Next}
            disabled={!isCorrect}
            activeOpacity={0.85}
          >
            <Feather name="alert-circle" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Haan, Permanently Cancel Karo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keepBtn, { marginTop: 12 }]}
            onPress={() => router.back()}
          >
            <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.keepGrad}>
              <Text style={styles.keepText}>Nahi! Pro Rakhna Chahta Hoon</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 – Countdown
  // ══════════════════════════════════════════════════════════════════════════
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      <View style={styles.countdownCenter}>
        {cancelling || countdown === 0 ? (
          <>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={[styles.cancellingText, { color: colors.foreground }]}>
              Cancel ho raha hai...
            </Text>
          </>
        ) : (
          <>
            <View style={styles.timerCircle}>
              <Text style={styles.timerNum}>{countdown}</Text>
              <Text style={styles.timerSec}>seconds</Text>
            </View>

            <Text style={[styles.countdownTitle, { color: colors.foreground }]}>
              {countdown} second mein cancel hoga...
            </Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: barWidth }]} />
            </View>

            <Text style={[styles.countdownSub, { color: colors.mutedForeground }]}>
              Yeh aapka aakhri mauka hai ruk jaane ka
            </Text>

            {/* BIG abort button */}
            <TouchableOpacity
              style={styles.abortBtn}
              onPress={abortCountdown}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#fbbf24", "#f59e0b"]} style={styles.abortGrad}>
                <Feather name="x" size={22} color="#000" />
                <View>
                  <Text style={styles.abortText}>RUKK JAO! Cancel Mat Karo</Text>
                  <Text style={styles.abortSub}>Tap karo aur Pro membership bachao</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.letItBe, { color: colors.mutedForeground }]}>
              Ya {countdown}s wait karo automatically cancel hone ke liye
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerStep: { fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 2 },
  stepDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: "#fbbf24", width: 18, borderRadius: 4 },

  scroll: { padding: 20 },

  // Step 1
  warningBox: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa",
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  warningTitle: { fontSize: 15, fontWeight: "800", color: "#92400e", marginBottom: 4 },
  warningSub: { fontSize: 12, color: "#92400e", lineHeight: 17 },
  lossCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  lossIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  lossTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  lossDesc: { fontSize: 11, lineHeight: 16 },
  renewalBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 24,
  },
  renewalText: { flex: 1, fontSize: 13, lineHeight: 19 },

  keepBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  keepGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  keepText: { fontSize: 16, fontWeight: "800", color: "#000" },

  continueCancel: {
    borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  continueCancelText: { fontSize: 13, fontWeight: "600" },

  // Step 2
  retentionHero: { alignItems: "center", marginBottom: 24 },
  retTitle: { fontSize: 22, fontWeight: "900", marginTop: 12, textAlign: "center" },
  retSub: { fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 },
  offerCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 2, borderRadius: 18, padding: 14, marginBottom: 14,
  },
  offerIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  offerLabel: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  offerSub: { fontSize: 12, lineHeight: 17 },
  offerCta: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 4 },
  offerCtaText: { color: "#fff", fontSize: 11, fontWeight: "800", textAlign: "center" },
  proofBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  proofText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Step 3
  confirmHero: { alignItems: "center", marginBottom: 24 },
  confirmTitle: { fontSize: 22, fontWeight: "900", marginTop: 12, textAlign: "center" },
  confirmSub: { fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
  confirmInput: {
    borderWidth: 2, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18,
    fontSize: 20, fontWeight: "900", textAlign: "center", letterSpacing: 4,
    marginBottom: 10,
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  hintText: { fontSize: 13, color: "#ef4444", fontWeight: "600" },
  scaryBox: {
    borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 24,
  },
  scaryTitle: { fontSize: 14, fontWeight: "800", color: "#dc2626", marginBottom: 8 },
  scaryItem: { fontSize: 13, color: "#b91c1c", marginBottom: 4, lineHeight: 18 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, borderRadius: 14,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Step 4
  countdownCenter: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  timerCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#ef4444",
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  timerNum: { fontSize: 48, fontWeight: "900", color: "#ef4444" },
  timerSec: { fontSize: 12, color: "#ef4444", fontWeight: "700", marginTop: -6 },
  countdownTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  progressTrack: { width: "100%", height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginBottom: 16, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#ef4444", borderRadius: 4 },
  countdownSub: { fontSize: 13, textAlign: "center", marginBottom: 30 },
  abortBtn: { width: "100%", borderRadius: 18, overflow: "hidden", marginBottom: 16, elevation: 6, shadowColor: "#fbbf24", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  abortGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 22, paddingHorizontal: 20 },
  abortText: { fontSize: 18, fontWeight: "900", color: "#000" },
  abortSub: { fontSize: 11, color: "#000", opacity: 0.7 },
  letItBe: { fontSize: 12, textAlign: "center" },
  cancellingText: { fontSize: 16, fontWeight: "700", marginTop: 20 },

  // Done
  doneCenter: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  sadIcon: { marginBottom: 20 },
  doneTitle: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 10 },
  doneSub: { fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 30 },
  doneBackBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, marginBottom: 14 },
  doneBackText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  resubBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  resubText: { fontSize: 14, fontWeight: "700" },
});
