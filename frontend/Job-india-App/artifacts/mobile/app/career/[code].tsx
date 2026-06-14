import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type CareerCode = "IAS" | "IPS" | "IFS" | "IRS" | "NDA" | "RBI" | "ISRO";

type CareerDetail = {
  code: CareerCode;
  title: string;
  serviceName: string;
  exam: string;
  latestUpdate: string;
  lastRecruitmentTrend: string;
  jobDescription: string[];
  eligibility: string[];
  education: string[];
  nextProcessStart: string;
  nextRecruitmentChance: string;
};

const CAREER_DATA: Record<CareerCode, CareerDetail> = {
  IAS: {
    code: "IAS",
    title: "IAS Latest Updates",
    serviceName: "Indian Administrative Service",
    exam: "UPSC Civil Services Examination (CSE)",
    latestUpdate: "Vacancy trend is steady. Competition is high. Focus on GS, Essay, and optional subject depth.",
    lastRecruitmentTrend: "Recent cycles showed stable seats with minor year-on-year changes.",
    jobDescription: ["District and state-level administration", "Policy execution and public service delivery", "Disaster response and governance monitoring"],
    eligibility: ["Indian citizen", "Graduate from a recognized university", "Age and attempt limits as per UPSC category rules"],
    education: ["Any bachelor's degree (BA/BSc/BCom/BTech etc.)", "Final-year students can apply as per UPSC notification"],
    nextProcessStart: "Prelims notification usually starts in the first half of the year.",
    nextRecruitmentChance: "Very high chance every year (annual UPSC cycle).",
  },
  IPS: {
    code: "IPS",
    title: "IPS Latest Updates",
    serviceName: "Indian Police Service",
    exam: "UPSC Civil Services Examination (CSE)",
    latestUpdate: "Demand remains strong. Physical and medical fitness preparation should start early.",
    lastRecruitmentTrend: "Recruitment volume usually follows UPSC yearly pattern.",
    jobDescription: ["Law and order leadership", "Crime prevention, investigation supervision", "Police force management"],
    eligibility: ["Indian citizen", "Graduate from a recognized university", "Must meet physical and medical standards"],
    education: ["Any bachelor's degree from a recognized institution"],
    nextProcessStart: "Follows the annual UPSC CSE timeline.",
    nextRecruitmentChance: "Very high chance every year under UPSC CSE.",
  },
  IFS: {
    code: "IFS",
    title: "IFS Latest Updates",
    serviceName: "Indian Foreign Service",
    exam: "UPSC Civil Services Examination (CSE)",
    latestUpdate: "Seats are limited and rank cutoff is high. International affairs awareness is key.",
    lastRecruitmentTrend: "Selection remains highly competitive with limited seats.",
    jobDescription: ["Diplomatic representation of India abroad", "Foreign policy support", "Embassy and consulate administration"],
    eligibility: ["Indian citizen", "Graduate from a recognized university"],
    education: ["Any bachelor's degree is accepted"],
    nextProcessStart: "Follows the annual UPSC CSE timeline.",
    nextRecruitmentChance: "High chance every year, but fewer seats than IAS/IPS.",
  },
  IRS: {
    code: "IRS",
    title: "IRS Latest Updates",
    serviceName: "Indian Revenue Service",
    exam: "UPSC Civil Services Examination (CSE)",
    latestUpdate: "Focus on Direct and Indirect Taxes. High integrity and analytical skills required.",
    lastRecruitmentTrend: "Steady requirement for IT and Customs departments.",
    jobDescription: ["Tax administration and enforcement", "Revenue collection and policy implementation", "Economic law enforcement"],
    eligibility: ["Indian citizen", "Graduate from a recognized university"],
    education: ["Bachelor's degree (Finance/Economics/Law background is helpful)"],
    nextProcessStart: "Part of the annual UPSC CSE notification.",
    nextRecruitmentChance: "Consistent vacancies every year.",
  },
  NDA: {
    code: "NDA",
    title: "NDA Latest Updates",
    serviceName: "National Defence Academy",
    exam: "UPSC NDA & NA Examination",
    latestUpdate: "SSB interview preparation is equally important as written exam.",
    lastRecruitmentTrend: "Two cycles per year (NDA I & II).",
    jobDescription: ["Commissioned Officer in Army, Navy, or Air Force", "Leadership in military operations", "Nation security and defense"],
    eligibility: ["Unmarried male & female candidates", "Age: 16.5 to 19.5 years", "Physical standards as per military rules"],
    education: ["12th Pass (Physics/Math required for Air Force & Navy)"],
    nextProcessStart: "NDA I (January), NDA II (June/July).",
    nextRecruitmentChance: "Guaranteed twice a year.",
  },
  RBI: {
    code: "RBI",
    title: "RBI Grade B Latest Updates",
    serviceName: "Reserve Bank of India Services",
    exam: "RBI Grade B Recruitment Exam",
    latestUpdate: "Very high level of competition. Strong grip on Finance and Management is required.",
    lastRecruitmentTrend: "Annual recruitment for Grade B Officers.",
    jobDescription: ["Monetary policy implementation", "Currency management", "Banking supervision"],
    eligibility: ["Indian citizen", "Age: 21 to 30 years", "Minimum 60% in Graduation"],
    education: ["Graduate / Post Graduate in any discipline"],
    nextProcessStart: "Usually notified in the second half of the year.",
    nextRecruitmentChance: "High chance every year.",
  },
  ISRO: {
    code: "ISRO",
    title: "ISRO Scientist Latest Updates",
    serviceName: "Indian Space Research Organisation",
    exam: "ICRB Recruitment / GATE Score",
    latestUpdate: "Technical knowledge in Aerospace/Electronics/Mechanical is paramount.",
    lastRecruitmentTrend: "Recruitment based on mission requirements and annual intake.",
    jobDescription: ["Space research and satellite development", "Mission planning and execution", "Advanced engineering research"],
    eligibility: ["Indian citizen", "First class engineering degree", "Gate score qualification in some categories"],
    education: ["B.E / B.Tech in relevant branch with 65% aggregate"],
    nextProcessStart: "Variable depending on vacancies.",
    nextRecruitmentChance: "Moderate to high based on department needs.",
  }
};

export default function CareerDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const { code } = useLocalSearchParams<{ code?: string }>();

  const normalizedCode = String(code || "").toUpperCase() as CareerCode;
  const data = CAREER_DATA[normalizedCode] || CAREER_DATA.IAS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{data.code} Career Track</Text>
          <Text style={styles.headerSub}>{data.serviceName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 26 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {data.title}
          </Text>
          <Text style={[styles.heroLine, { color: colors.mutedForeground }]}>
            Exam: {data.exam}
          </Text>
          <Text style={[styles.heroUpdate, { color: colors.secondary }]}>
            {data.latestUpdate}
          </Text>
        </View>

        <InfoCard title="Last Recruitment Trend" colors={colors}>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {data.lastRecruitmentTrend}
          </Text>
        </InfoCard>

        <InfoCard title="Job Description" colors={colors}>
          {data.jobDescription.map((item) => (
            <Bullet key={item} text={item} color={colors.foreground} />
          ))}
        </InfoCard>

        <InfoCard title="Eligibility" colors={colors}>
          {data.eligibility.map((item) => (
            <Bullet key={item} text={item} color={colors.foreground} />
          ))}
        </InfoCard>

        <InfoCard title="Education Information" colors={colors}>
          {data.education.map((item) => (
            <Bullet key={item} text={item} color={colors.foreground} />
          ))}
        </InfoCard>

        <InfoCard title="Next Process Start" colors={colors}>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {data.nextProcessStart}
          </Text>
        </InfoCard>

        <InfoCard title="Next Recruitment Chance" colors={colors}>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {data.nextRecruitmentChance}
          </Text>
        </InfoCard>
      </ScrollView>
    </View>
  );
}

function InfoCard({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color }]}>•</Text>
      <Text style={[styles.bulletText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  scroll: { padding: 16, gap: 10 },
  heroCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  heroTitle: { fontSize: 16, fontWeight: "800" },
  heroLine: { fontSize: 12, marginTop: 4 },
  heroUpdate: { fontSize: 13, marginTop: 10, fontWeight: "600", lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  cardBody: { gap: 6 },
  bodyText: { fontSize: 13, lineHeight: 20 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  bulletDot: { fontSize: 13, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
