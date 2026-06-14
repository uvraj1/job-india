import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
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
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";

const FAQS = [
  {
    q: "How do I apply for a government job?",
    a: "Go to the Jobs tab, open a job, and tap 'Apply Now'. We will send you to the official government site to apply.",
  },
  {
    q: "What is Match Score?",
    a: "Match Score checks your profile (skills, study, category, age) with job needs and shows a percent of how well you fit.",
  },
  {
    q: "How can I improve my Match Score?",
    a: "Complete your profile: add skills, study, work, certificates, city, and category. A more complete profile gives a better score.",
  },
  {
    q: "Is Job India free to use?",
    a: "Yes. Browsing jobs, saving jobs, and applying is free. Extra Premium features are coming soon.",
  },
  {
    q: "Why can't I see my application on the government site?",
    a: "We send you to official sites (UPSC, SSC, etc.). Your application status there is managed by that department, not by Job India.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Account Settings → Delete Account. This action is final and all your data will be removed.",
  },
];

const TICKET_CATEGORIES = [
  "Resume upload issue",
  "Login / Sign-in issue",
  "Job not showing right",
  "Match Score looks wrong",
  "Notification issue",
  "Payment or subscription",
  "Other",
];

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketMode, setTicketMode] = useState(false);
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketText, setTicketText] = useState("");

  const handleSubmitTicket = () => {
    if (!ticketCategory)
      return Alert.alert("Select Category", "Please choose an issue type.");
    if (!ticketText.trim())
      return Alert.alert("Describe Issue", "Please write your issue in short.");
    Alert.alert(
      "Ticket Submitted ✓",
      "We got your message. Our team will reply by email within 24 hours.",
      [
        {
          text: "OK",
          onPress: () => {
            setTicketMode(false);
            setTicketCategory("");
            setTicketText("");
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: "#1A5276" },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("support_about")}</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>We are here to help</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setTicketMode(!ticketMode)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#E8EAF6" }]}>
              <Feather name="message-square" size={20} color="#1A3A5C" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>
              Create a Ticket
            </Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
              Reply in 24h
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => Linking.openURL("mailto:jobindia.customar.services@gmail.com")}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="mail" size={20} color="#2D6A4F" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>
              Email Us
            </Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
              jobindia.customar.services@gmail.com
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() =>
              Alert.alert("Rate Us", "Open Play Store to give a rating?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open",
                  onPress: () => Linking.openURL("https://play.google.com"),
                },
              ])
            }
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#FFF9C4" }]}>
              <Feather name="star" size={20} color="#F4A623" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>
              Rate Us
            </Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
              Play Store / App Store
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ticket Form */}
        {ticketMode && (
          <View
            style={[
              styles.ticketForm,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.ticketTitle, { color: colors.foreground }]}>
              Create a Support Ticket
            </Text>
            <Text
              style={[styles.ticketHint, { color: colors.mutedForeground }]}
            >
              Choose issue type:
            </Text>
            <View style={styles.categoryWrap}>
              {TICKET_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        ticketCategory === cat ? colors.primary : colors.muted,
                      borderColor:
                        ticketCategory === cat ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTicketCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          ticketCategory === cat ? "#fff" : colors.foreground,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                styles.ticketInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
              placeholder="Write your issue..."
              placeholderTextColor={colors.mutedForeground}
              value={ticketText}
              onChangeText={setTicketText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.ticketActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setTicketMode(false)}
              >
                <Text
                  style={[styles.cancelText, { color: colors.mutedForeground }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmitTicket}
              >
                <Feather name="send" size={14} color="#fff" />
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FAQs */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          COMMON QUESTIONS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <React.Fragment key={idx}>
                <TouchableOpacity
                  style={styles.faqRow}
                  onPress={() => setOpenFaq(isOpen ? null : idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}
                  >
                    {faq.q}
                  </Text>
                  <Feather
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View
                    style={[
                      styles.faqAnswer,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text
                      style={[styles.faqA, { color: colors.mutedForeground }]}
                    >
                      {faq.a}
                    </Text>
                  </View>
                )}
                {idx < FAQS.length - 1 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Legal & About */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          LEGAL & ABOUT
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {[
            {
              icon: "file-text" as const,
              label: "Terms of Service",
              onPress: () =>
                Linking.openURL("https://uvraj1.github.io/job-india-Terms-of-Service/"),
            },
            {
              icon: "shield" as const,
              label: "Privacy Policy",
              onPress: () =>
                Linking.openURL("https://uvraj1.github.io/Privacy-Policy-Job-india/"),
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.legalRow,
                {
                  borderBottomWidth: idx === 0 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={16} color={colors.primary} />
              <Text style={[styles.legalLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Feather
                name="external-link"
                size={14}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.versionBadge,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Job India
          </Text>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            Version 1.0.0 (Build 1)
          </Text>
          <Text style={[styles.tagline, { color: colors.secondary }]}>
            Your path to government and global jobs
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
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 13, fontWeight: "700" as const, textAlign: "center" },
  quickSub: { fontSize: 10, textAlign: "center" },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  faqRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  faqQ: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
  },
  faqA: { fontSize: 13, lineHeight: 20 },
  divider: { height: 1 },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  legalLabel: { flex: 1, fontSize: 15, fontWeight: "500" as const },
  versionBadge: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  appName: { fontSize: 18, fontWeight: "800" as const },
  versionText: { fontSize: 13 },
  tagline: { fontSize: 12, fontWeight: "500" as const },
  ticketForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  ticketTitle: { fontSize: 16, fontWeight: "700" as const },
  ticketHint: { fontSize: 13 },
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryText: { fontSize: 13, fontWeight: "500" as const },
  ticketInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
  },
  ticketActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600" as const },
  submitBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { fontSize: 14, fontWeight: "700" as const, color: "#fff" },
});
