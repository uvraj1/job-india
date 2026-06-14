import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/context/SubscriptionContext";

const HR_PROFILES = [
  { id: "1", name: "Priya Sharma", company: "Infosys", role: "HR Manager", avatar: "P", color: "#3b82f6", online: true },
  { id: "2", name: "Rahul Verma", company: "TCS", role: "Talent Acquisition", avatar: "R", color: "#10b981", online: true },
  { id: "3", name: "Anita Nair", company: "Wipro", role: "Senior Recruiter", avatar: "A", color: "#8b5cf6", online: false },
  { id: "4", name: "Suresh Kumar", company: "HDFC Bank", role: "HR Lead", avatar: "S", color: "#f59e0b", online: true },
];

const AUTO_REPLIES: Record<string, string[]> = {
  "1": [
    "Hi! I'm looking for experienced candidates in React Native and Node.js. Do you have experience with these?",
    "That's great! We have multiple openings at Infosys. Can you share your updated resume?",
    "I've forwarded your profile to our hiring team. Expect a call within 2 business days!",
  ],
  "2": ["Hello! TCS is hiring for multiple positions. What's your preferred location?", "Great! We have openings in that location. What's your current CTC?", "Perfect fit! I'll schedule a preliminary interview for you. Are you available this week?"],
  "3": ["Hi there! Wipro has exciting openings for fresher candidates. What's your qualification?", "Excellent! We conduct campus-like drives for experienced hires too. Interested?", "I'll add you to our priority list. You'll hear from us soon."],
  "4": ["Hello! HDFC Bank is expanding. We're looking for banking professionals. Are you interested?", "Great background! Our interview process is 3 rounds. Shall I proceed with your application?", "Done! You're shortlisted. Our team will contact you for scheduling."],
};

interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  time: string;
}

function ChatScreen({ hr, onBack }: { hr: typeof HR_PROFILES[0]; onBack: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      text: `Hi! I'm ${hr.name} from ${hr.company}. Your Pro profile caught my attention. How can I help you?`,
      fromUser: false,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [replyIdx, setReplyIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: Date.now().toString(), text: input.trim(), fromUser: true, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const replies = AUTO_REPLIES[hr.id] || [];
    if (replyIdx < replies.length) {
      setTimeout(() => {
        const hrMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: replies[replyIdx],
          fromUser: false,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, hrMsg]);
        setReplyIdx((i) => i + 1);
      }, 1200);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.hrAvatar, { backgroundColor: hr.color }]}>
          <Text style={styles.hrAvatarText}>{hr.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>{hr.name}</Text>
          <Text style={styles.chatHeaderRole}>{hr.role} · {hr.company}</Text>
        </View>
        {hr.online && <View style={styles.onlineDot} />}
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.messageList, { backgroundColor: colors.background }]}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.fromUser ? styles.msgRowUser : styles.msgRowHR]}>
            {!item.fromUser && (
              <View style={[styles.miniAvatar, { backgroundColor: hr.color }]}>
                <Text style={styles.miniAvatarText}>{hr.avatar}</Text>
              </View>
            )}
            <View style={[
              styles.bubble,
              item.fromUser
                ? { backgroundColor: "#1E3A8A" }
                : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}>
              <Text style={[styles.bubbleText, { color: item.fromUser ? "#fff" : colors.foreground }]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, { color: item.fromUser ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                {item.time}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.msgInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? "#1E3A8A" : colors.muted }]}
          onPress={send}
          disabled={!input.trim()}
        >
          <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function HRChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useSubscription();
  const [selectedHR, setSelectedHR] = useState<typeof HR_PROFILES[0] | null>(null);

  if (!subscription.isActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Direct HR Messaging</Text>
        </View>
        <View style={styles.gateWrap}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Pro Feature</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Upgrade to Pro to message HRs directly and fast-track your job applications.
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

  if (selectedHR) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChatScreen hr={selectedHR} onBack={() => setSelectedHR(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0F172A", "#1E3A8A"]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Direct HR Messaging</Text>
          <Text style={styles.headerSub}>{HR_PROFILES.filter((h) => h.online).length} HRs online now</Text>
        </View>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </LinearGradient>

      <View style={[styles.infoBar, { backgroundColor: "#f0fdf4", borderBottomColor: "#bbf7d0" }]}>
        <Feather name="zap" size={14} color="#16a34a" />
        <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
          Pro members get 5x faster HR responses
        </Text>
      </View>

      <FlatList
        data={HR_PROFILES}
        keyExtractor={(h) => h.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.hrCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedHR(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.hrAvatar, { backgroundColor: item.color }]}>
              <Text style={styles.hrAvatarText}>{item.avatar}</Text>
              {item.online && <View style={styles.onlineBadge} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.hrNameRow}>
                <Text style={[styles.hrName, { color: colors.foreground }]}>{item.name}</Text>
                {item.online && (
                  <View style={styles.onlineChip}>
                    <Text style={styles.onlineChipText}>Online</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.hrRole, { color: colors.mutedForeground }]}>{item.role}</Text>
              <View style={styles.companyRow}>
                <Feather name="briefcase" size={12} color={item.color} />
                <Text style={[styles.companyText, { color: item.color }]}>{item.company}</Text>
              </View>
            </View>
            <Feather name="message-circle" size={20} color={item.color} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  proBadge: { backgroundColor: "#fbbf2430", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: "#fbbf2460" },
  proBadgeText: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  infoBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  listContent: { padding: 16, gap: 12 },
  hrCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  hrAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", position: "relative" },
  hrAvatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  onlineBadge: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: "#10b981", borderWidth: 2, borderColor: "#fff" },
  hrNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  hrName: { fontSize: 15, fontWeight: "700" },
  onlineChip: { backgroundColor: "#f0fdf4", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  onlineChipText: { color: "#16a34a", fontSize: 10, fontWeight: "700" },
  hrRole: { fontSize: 12, marginBottom: 4 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyText: { fontSize: 12, fontWeight: "600" },
  chatHeader: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0F172A" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  chatHeaderName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chatHeaderRole: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" },
  messageList: { padding: 16, gap: 10, flexGrow: 1 },
  msgRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowHR: { justifyContent: "flex-start", alignItems: "flex-end" },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  miniAvatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: "flex-end" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1 },
  msgInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  gateTitle: { fontSize: 22, fontWeight: "800" },
  gateSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  upgradeBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  upgradeBtnGrad: { paddingVertical: 14, paddingHorizontal: 28, alignItems: "center" },
  upgradeBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
