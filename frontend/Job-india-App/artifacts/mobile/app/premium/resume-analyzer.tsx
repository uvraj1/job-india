import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import { useSubscription } from "@/context/SubscriptionContext";

const ANALYSES: Record<string, { score: number; grade: string; color: string; feedback: string[]; keywords: string[]; improvements: string[] }> = {
  software: {
    score: 78,
    grade: "B+",
    color: "#3b82f6",
    feedback: [
      "Add measurable achievements (e.g., 'improved load time by 40%')",
      "Include cloud technologies like AWS, GCP, or Azure",
      "Mention CI/CD pipelines and DevOps practices",
      "Your tech stack section is strong — highlight frameworks prominently",
    ],
    keywords: ["React", "Node.js", "REST API", "Docker", "Agile"],
    improvements: ["Add GitHub profile link", "Quantify impact in each role"],
  },
  government: {
    score: 85,
    grade: "A",
    color: "#10b981",
    feedback: [
      "Excellent format — clean and ATS-friendly",
      "Add your category (General/OBC/SC/ST) clearly",
      "Include all qualifying examinations with ranks",
      "Mention relevant government schemes you have knowledge of",
    ],
    keywords: ["UPSC", "SSC", "State PSC", "Category", "Age", "Qualification"],
    improvements: ["Add NOC details if applicable", "List language proficiency"],
  },
  default: {
    score: 72,
    grade: "B",
    color: "#f59e0b",
    feedback: [
      "Include quantifiable achievements in every role",
      "Add industry-specific keywords to pass ATS screening",
      "Your 'Experience' section looks well-structured",
      "Ensure your contact information is complete and up-to-date",
    ],
    keywords: ["Communication", "Leadership", "Problem Solving", "Teamwork"],
    improvements: ["Add a professional summary at the top", "List certifications prominently"],
  },
};

export default function ResumeAnalyzerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useSubscription();
  const [jobTarget, setJobTarget] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!subscription.isActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>AI Resume Analyzer</Text>
        </View>
        <View style={styles.gateWrap}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Upgrade to Pro to get AI-powered resume analysis and actionable feedback.
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

  const startAnalysis = () => {
    if (!jobTarget.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const lower = jobTarget.toLowerCase();
      const data = lower.includes("software") || lower.includes("developer") || lower.includes("engineer")
        ? ANALYSES.software
        : lower.includes("govt") || lower.includes("government") || lower.includes("ias") || lower.includes("ssc")
        ? ANALYSES.government
        : ANALYSES.default;
      setResult(data);
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>AI Resume Analyzer</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}>
        {!result ? (
          <View style={styles.inputSection}>
            <View style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#1E3A8A", "#3b82f6"]} style={styles.fileIcon}>
                <Feather name="file-text" size={30} color="#fff" />
              </LinearGradient>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Resume Ready</Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                AI will analyze your profile against the target role
              </Text>
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Target Job Title / Role
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Software Engineer, IAS Officer, Data Analyst"
                placeholderTextColor={colors.mutedForeground}
                value={jobTarget}
                onChangeText={setJobTarget}
              />
              <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
                Be specific for better analysis
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.analyzeBtn, { opacity: !jobTarget.trim() ? 0.5 : 1 }]}
              onPress={startAnalysis}
              disabled={analyzing || !jobTarget.trim()}
            >
              <LinearGradient colors={["#1E3A8A", "#3b82f6"]} style={styles.analyzeBtnGrad}>
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="zap" size={18} color="#fff" />
                    <Text style={styles.analyzeBtnText}>Analyze My Resume</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: result.color }]}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Resume Score</Text>
              <Text style={[styles.scoreValue, { color: result.color }]}>{result.score}%</Text>
              <View style={[styles.gradeBadge, { backgroundColor: result.color + "20" }]}>
                <Text style={[styles.gradeText, { color: result.color }]}>Grade: {result.grade}</Text>
              </View>
              <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.scoreBarFill, { width: `${result.score}%` as any, backgroundColor: result.color }]} />
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Suggestions</Text>
              {result.feedback.map((tip: string, i: number) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: result.color }]} />
                  <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Keywords Detected</Text>
              <View style={styles.tagsWrap}>
                {result.keywords.map((kw: string) => (
                  <View key={kw} style={[styles.tag, { backgroundColor: result.color + "15" }]}>
                    <Text style={[styles.tagText, { color: result.color }]}>{kw}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Improvements</Text>
              {result.improvements.map((imp: string, i: number) => (
                <View key={i} style={styles.improveRow}>
                  <Feather name="arrow-up-right" size={14} color="#10b981" />
                  <Text style={[styles.tipText, { color: colors.foreground }]}>{imp}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.border }]} onPress={() => { setResult(null); setJobTarget(""); }}>
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginLeft: 8 }}>Analyze for Different Role</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0F172A" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff", flex: 1 },
  proBadge: { backgroundColor: "#fbbf2430", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: "#fbbf2460" },
  proBadgeText: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  scroll: { padding: 20, gap: 16 },
  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  gateTitle: { fontSize: 22, fontWeight: "800" },
  gateSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  upgradeBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  upgradeBtnGrad: { paddingVertical: 14, paddingHorizontal: 28, alignItems: "center" },
  upgradeBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  inputSection: { gap: 16 },
  uploadBox: { borderWidth: 1.5, borderRadius: 20, padding: 28, alignItems: "center", gap: 12 },
  fileIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  uploadTitle: { fontSize: 18, fontWeight: "700" },
  uploadSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  inputBox: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: "700" },
  textInput: { borderWidth: 1, borderRadius: 10, padding: Platform.OS === "web" ? 10 : 13, fontSize: 14 },
  inputHint: { fontSize: 12 },
  analyzeBtn: { borderRadius: 16, overflow: "hidden" },
  analyzeBtnGrad: { paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  resultContainer: { gap: 16 },
  scoreCard: { borderWidth: 2, borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  scoreLabel: { fontSize: 13, fontWeight: "600" },
  scoreValue: { fontSize: 52, fontWeight: "900" },
  gradeBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  gradeText: { fontWeight: "800", fontSize: 13 },
  scoreBar: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipText: { fontSize: 13, lineHeight: 20, flex: 1 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: "700" },
  improveRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
});
