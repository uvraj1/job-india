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

interface QuestionData {
  id: number;
  question: string;
  feedback: {
    score: number;
    strengths: string[];
    gaps: string[];
    exemplar: string;
  };
}

const QUESTIONS: Record<string, QuestionData[]> = {
  software: [
    {
      id: 1,
      question: "How do you optimize a slow Web API endpoint?",
      feedback: {
        score: 88,
        strengths: [
          "Good mention of caching strategies (Redis) and DB optimization.",
          "Addressed payload compression and lazy loading appropriately."
        ],
        gaps: [
          "Could mention rate limiting or database indexing techniques explicitly.",
          "Did not cover connection pooling in database clients."
        ],
        exemplar: "To optimize an endpoint, profile the API to isolate bottlenecks. Key areas include implementing Redis caching for static/dynamic database reads, indexing active SQL columns, utilizing asynchronous execution/multithreading for heavy processing, compressing payloads, and establishing database connection pooling."
      }
    },
    {
      id: 2,
      question: "Explain the difference between SQL and NoSQL database schemas.",
      feedback: {
        score: 92,
        strengths: [
          "Strong explanation of ACID compliance versus horizontal scaling.",
          "Gave clear real-world examples (PostgreSQL vs MongoDB)."
        ],
        gaps: [
          "Missed listing specific data integrity trade-offs in highly relational tables."
        ],
        exemplar: "SQL databases are relational, table-based, strict schema databases designed for complex query structures and strong ACID compliance (e.g. PostgreSQL). NoSQL databases are non-relational, document or key-value based, schema-less, and built for dynamic schemas and seamless horizontal scaling (e.g. MongoDB)."
      }
    }
  ],
  government: [
    {
      id: 1,
      question: "What according to you are the core pillars of good public administration?",
      feedback: {
        score: 90,
        strengths: [
          "Excellent focus on transparency, integrity, and timely delivery of services.",
          "Cited relevant examples of citizen-centric e-governance."
        ],
        gaps: [
          "Could emphasize accountability mechanisms like RTI and citizen charters."
        ],
        exemplar: "The pillars are transparency, accountability, citizen-centric service delivery, and absolute integrity. These are achieved by digital governance integrations, making services accessible, protecting whistleblower mechanisms, and defining strict citizen charters."
      }
    },
    {
      id: 2,
      question: "How would you handle a resource shortage crisis in a high-priority rural development project?",
      feedback: {
        score: 85,
        strengths: [
          "Structured operational prioritization approach.",
          "Smart utilization of public-private partnerships (PPP) or community partnerships."
        ],
        gaps: [
          "Missed mentioning immediate reporting and official escalations protocols."
        ],
        exemplar: "First, perform audit checks to triage essential vs non-essential tasks. Reallocate local assets, deploy local community help schemes (e.g., MGNREGS convergence), secure fast-track approvals, and involve private local stakeholders through localized PPP models."
      }
    }
  ],
  default: [
    {
      id: 1,
      question: "Tell me about a time you resolved a major team conflict.",
      feedback: {
        score: 82,
        strengths: [
          "Used a clear STAR structure (Situation, Task, Action, Result).",
          "Emphasized active listening and collaborative conflict resolution."
        ],
        gaps: [
          "Could be more specific about the post-conflict monitoring or follow-up."
        ],
        exemplar: "In a past project, two developers disagreed on API endpoints structure. I set up a whiteboard session where both listed tech trade-offs. We structured a consensus decision metric based on speed and scale, aligning both. The conflict ended and delivery was on time."
      }
    },
    {
      id: 2,
      question: "What is your primary strength and how does it help your day-to-day productivity?",
      feedback: {
        score: 89,
        strengths: [
          "Gave a unique personal trait and backed it up with concrete work routines.",
          "Linked personal productivity to actual business value."
        ],
        gaps: [
          "Could mention how you mitigate potential over-commitment."
        ],
        exemplar: "My primary strength is systematic prioritisation and adaptability. I categorize my day using Eisenhower matrixes, completing deep-work tasks in the morning. This ensures high-impact tasks are delivered reliably even under pressure."
      }
    }
  ]
};

export default function MockInterviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useSubscription();

  const [jobTarget, setJobTarget] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [allScores, setAllScores] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  if (!subscription.isActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>AI Mock Interview Coach</Text>
        </View>
        <View style={styles.gateWrap}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Upgrade to Pro to unlock the AI Mock Interview Coach. Practice targeted interviews and get real-time feedback.
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

  const startInterview = () => {
    if (!jobTarget.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setStarted(true);
      setLoading(false);
      setCurrentIdx(0);
      setFeedback(null);
      setAllScores([]);
      setCompleted(false);
    }, 1800);
  };

  const getQuestionsSet = () => {
    const lower = jobTarget.toLowerCase();
    if (lower.includes("software") || lower.includes("developer") || lower.includes("engineer")) {
      return QUESTIONS.software;
    }
    if (lower.includes("govt") || lower.includes("government") || lower.includes("ias") || lower.includes("police")) {
      return QUESTIONS.government;
    }
    return QUESTIONS.default;
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const qSet = getQuestionsSet();
      const currentQ = qSet[currentIdx];
      const qFeedback = currentQ.feedback;
      setFeedback(qFeedback);
      setAllScores((prev) => [...prev, qFeedback.score]);
      setAnalyzing(false);
    }, 2200);
  };

  const nextQuestion = () => {
    const qSet = getQuestionsSet();
    if (currentIdx + 1 < qSet.length) {
      setCurrentIdx((prev) => prev + 1);
      setUserAnswer("");
      setFeedback(null);
    } else {
      setCompleted(true);
    }
  };

  const currentQSet = getQuestionsSet();
  const currentQuestion = currentQSet[currentIdx];

  const averageScore = allScores.length > 0 
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>AI Mock Interview Coach</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}>
        {!started ? (
          <View style={styles.setupContainer}>
            <View style={[styles.featureInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#8b5cf6", "#a78bfa"]} style={styles.micCircle}>
                <Feather name="mic" size={24} color="#fff" />
              </LinearGradient>
              <Text style={[styles.featureInfoTitle, { color: colors.foreground }]}>AI-Powered Prep Coach</Text>
              <Text style={[styles.featureInfoDesc, { color: colors.mutedForeground }]}>
                Experience a simulated job interview. Receive high-speed, structural grading and exact exemplar answers for every query.
              </Text>
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                What is your targeted role?
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Software Developer, Bank Manager, civil services"
                placeholderTextColor={colors.mutedForeground}
                value={jobTarget}
                onChangeText={setJobTarget}
              />
              <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
                Our AI will custom-tailor questions for this specific domain.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, { opacity: !jobTarget.trim() ? 0.5 : 1 }]}
              onPress={startInterview}
              disabled={loading || !jobTarget.trim()}
            >
              <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.startBtnGrad}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="play-circle" size={18} color="#fff" />
                    <Text style={styles.startBtnText}>Start Live Mock Interview</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : completed ? (
          <View style={styles.completedContainer}>
            <View style={[styles.scoreSummaryCard, { backgroundColor: colors.card, borderColor: "#10b981" }]}>
              <Feather name="check-circle" size={44} color="#10b981" />
              <Text style={[styles.scoreSummaryTitle, { color: colors.foreground }]}>Mock Interview Complete!</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground, marginTop: 4 }]}>Composite AI Rating</Text>
              <Text style={[styles.scoreValue, { color: "#10b981" }]}>{averageScore}%</Text>
              <View style={[styles.gradeBadge, { backgroundColor: "#10b98120" }]}>
                <Text style={{ color: "#10b981", fontWeight: "900", fontSize: 13 }}>
                  GRADE: {averageScore >= 90 ? "Excellent" : averageScore >= 80 ? "Above Average" : "Good"}
                </Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overall Performance Review</Text>
              <Text style={[styles.bodyText, { color: colors.foreground, lineHeight: 20 }]}>
                You demonstrated strong situational awareness. To improve further, continue practicing high-yield technical definitions and structural frameworks (like the STAR model for behavioural questions).
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.retryBtn, { borderColor: colors.border }]} 
              onPress={() => { 
                setStarted(false); 
                setJobTarget(""); 
                setCompleted(false); 
              }}
            >
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginLeft: 8, fontWeight: "700" }}>Start New Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            {/* Progress indicator */}
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                Question {currentIdx + 1} of {currentQSet.length}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((currentIdx + 1) / currentQSet.length) * 100}%` as any, backgroundColor: "#8b5cf6" }]} />
              </View>
            </View>

            {/* Question Panel */}
            <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: "#8b5cf6" }]}>
              <View style={[styles.qBadge, { backgroundColor: "#8b5cf620" }]}>
                <Text style={{ color: "#8b5cf6", fontWeight: "800", fontSize: 11 }}>ACTIVE PROMPT</Text>
              </View>
              <Text style={[styles.questionText, { color: colors.foreground }]}>
                \"{currentQuestion.question}\"
              </Text>
            </View>

            {!feedback ? (
              <View style={styles.answerSection}>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>Your Response</Text>
                  <TextInput
                    style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    multiline={true}
                    numberOfLines={6}
                    placeholder="Type your structured answer here... STAR framework recommended."
                    placeholderTextColor={colors.mutedForeground}
                    value={userAnswer}
                    onChangeText={setUserAnswer}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { opacity: !userAnswer.trim() ? 0.5 : 1 }]}
                  onPress={submitAnswer}
                  disabled={analyzing || !userAnswer.trim()}
                >
                  <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.startBtnGrad}>
                    {analyzing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Feather name="zap" size={18} color="#fff" />
                        <Text style={styles.startBtnText}>Analyze Answer</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.feedbackContainer}>
                {/* Score panel */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: "#10b981", alignItems: "center" }]}>
                  <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Response Score</Text>
                  <Text style={[styles.scoreValue, { color: "#10b981", fontSize: 44 }]}>{feedback.score}%</Text>
                </View>

                {/* Gaps / Strengths */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: "#10b981" }]}>Strengths</Text>
                  {feedback.strengths.map((s: string, idx: number) => (
                    <View key={idx} style={styles.feedbackBullet}>
                      <Feather name="check" size={14} color="#10b981" style={{ marginTop: 2 }} />
                      <Text style={[styles.bodyText, { color: colors.foreground }]}>{s}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: "#f59e0b" }]}>Areas to Improve</Text>
                  {feedback.gaps.map((g: string, idx: number) => (
                    <View key={idx} style={styles.feedbackBullet}>
                      <Feather name="alert-circle" size={14} color="#f59e0b" style={{ marginTop: 2 }} />
                      <Text style={[styles.bodyText, { color: colors.foreground }]}>{g}</Text>
                    </View>
                  ))}
                </View>

                {/* Exemplar */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: "#8b5cf6" }]}>Perfect Exemplar Response</Text>
                  <Text style={[styles.bodyText, { color: colors.foreground, fontStyle: "italic", lineHeight: 20 }]}>
                    \"{feedback.exemplar}\"
                  </Text>
                </View>

                {/* Next button */}
                <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                  <LinearGradient colors={["#10b981", "#059669"]} style={styles.startBtnGrad}>
                    <Text style={styles.startBtnText}>
                      {currentIdx + 1 < currentQSet.length ? "Proceed to Next Question →" : "Finish & Get Report →"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
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
  setupContainer: { gap: 16 },
  featureInfoCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  micCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  featureInfoTitle: { fontSize: 18, fontWeight: "800" },
  featureInfoDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  inputBox: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: "700" },
  textInput: { borderWidth: 1, borderRadius: 10, padding: Platform.OS === "web" ? 10 : 13, fontSize: 14 },
  inputHint: { fontSize: 12 },
  startBtn: { borderRadius: 16, overflow: "hidden" },
  startBtnGrad: { paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  startBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  activeContainer: { gap: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  progressText: { fontSize: 13, fontWeight: "700" },
  progressTrack: { flex: 1, height: 6, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 3, marginLeft: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  questionCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, gap: 10 },
  qBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  questionText: { fontSize: 16, fontWeight: "700", lineHeight: 22, fontStyle: "italic" },
  answerSection: { gap: 16 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14, height: 120, textAlignVertical: "top" },
  submitBtn: { borderRadius: 16, overflow: "hidden" },
  feedbackContainer: { gap: 16 },
  scoreLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  scoreValue: { fontSize: 36, fontWeight: "900", marginTop: 2 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  feedbackBullet: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bodyText: { fontSize: 13, lineHeight: 19, flex: 1 },
  nextBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  completedContainer: { gap: 16, alignItems: "center" },
  scoreSummaryCard: { width: "100%", borderWidth: 2, borderRadius: 24, padding: 32, alignItems: "center", gap: 10 },
  scoreSummaryTitle: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  gradeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, borderWidth: 1, width: "100%", marginTop: 8 },
});
