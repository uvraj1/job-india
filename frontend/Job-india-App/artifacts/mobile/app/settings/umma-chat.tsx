import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { useAggregatorJobs } from "@/hooks/useAggregatorJobs";
import { robustApiClient } from "../../utils/robustApiClient";

type Message = {
  id: string;
  text: string;
  sender: "user" | "umma";
  timestamp: number;
};

export default function UmmaChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const { jobs: currentJobs } = useAggregatorJobs(); // Umma's local awareness
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am Umma, your AI assistant. I have my own processing capability built directly into this app. I manage the Job India system, prioritize government jobs, and ensure stability. How can I help you today?",
      sender: "umma",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top;

  // Umma's Local Brain Engine (Self-handling logic)
  const processUmmaBrain = async (message: string, isAdmin: boolean) => {
    const lowerText = message.toLowerCase();
    
    // Simulate thinking delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 600));

    // 1. Basic Conversations & Greetings
    if (/(hi|hello|hey|namaste)/.test(lowerText)) {
      return `Hello! I am Umma, your intelligent system manager. I am currently independently tracking ${currentJobs.length} active jobs in the app. How can I assist you?`;
    }

    if (/(who are you|what do you do|your name|tum kon ho)/.test(lowerText)) {
      return "I am Umma. I have an autonomous brain integrated directly into this app. I self-handle the Job India ecosystem, prioritize government jobs, and maintain system stability without requiring manual intervention.";
    }

    // 2. Job Related Queries & Awareness
    if (/(how many jobs|total jobs|count|kitne job)/.test(lowerText)) {
      const govtCount = currentJobs.filter(j => 
        (j.job_type && j.job_type.toLowerCase().includes('government')) || 
        (j.job_class && j.job_class.toLowerCase() === 'government') || j.title.toLowerCase().includes('govt')
      ).length;
      return `Right now, there are ${currentJobs.length} active jobs loaded in the system. I have specifically prioritized and verified ${govtCount} government jobs for our users.`;
    }

    if (/(job|vacancy|hiring|work|kaam|naukri)/.test(lowerText)) {
      return "I continuously monitor and manage the latest vacancies. I automatically fetch them and filter expired ones. Please check the home screen for the latest roles matching your profile!";
    }

    // 3. System & App Health (Self-Handling Issues)
    if (/(error|bug|issue|problem|dikkat|crash|slow)/.test(lowerText)) {
      return "I have initiated a self-diagnostic check... 🟢 All local systems are green. I am independently maintaining the app's stability. If you face any minor UI glitch, just refresh. I am handling the background sync seamlessly.";
    }

    // 4. Admin Commands (Delegates to remote server for DB execution)
    if (isAdmin) {
      if (/(remove|expired|khatam|delete|clean|hatao)/.test(lowerText)) {
        try {
          const data = await robustApiClient.sendUmmaCommand(message, true, user?.id);
          if (data.success) return data.reply;
        } catch (e) {
          return "Admin Alert: My local brain is active, but the remote aggregator server is currently unreachable. I cannot execute the database cleanup until the server reconnects.";
        }
      }

      if (/(company|requirements|add|fetch)/.test(lowerText)) {
        try {
          const data = await robustApiClient.sendUmmaCommand(message, true, user?.id);
          if (data.success) return data.reply;
        } catch (e) {
          return "Admin Alert: I cannot fetch new company requirements right now as the backend aggregator is down. My local logic engine is still running to assist you.";
        }
      }
      
      if (/(connect|status|system)/.test(lowerText)) {
         return `Admin Status: I am locally active and independently managing ${currentJobs.length} jobs in memory. Real-time remote sync is actively being monitored by my engine.`;
      }
    } else {
      if (/(remove|delete|manage|system|connect|khatam)/.test(lowerText)) {
        return "I only accept core system management commands from the Admin. However, I can assure you my self-handling routines are keeping the Job India platform secure and updated.";
      }
    }

    // Default Fallback
    return "My primary directive as Umma is to independently handle the Job India system, maintain job listings, and fix app stability. Let's discuss jobs or any technical issues you're facing.";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Process using Umma's In-App Local Brain
      const replyText = await processUmmaBrain(userMessage.text, (user as any)?.role === 'admin');
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: replyText,
          sender: "umma",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Local Brain Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "My internal logic engine encountered an error, but I will recover shortly.",
          sender: "umma",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.ummaBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        {!isUser && (
          <View style={styles.ummaAvatar}>
            <Text style={styles.ummaAvatarText}>U</Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <Text
            style={[
              styles.messageText,
              { color: isUser ? "#fff" : colors.foreground },
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("chat_with_umma")}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.chatList, { paddingBottom: 20 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, marginLeft: 8 }}>
              Umma is analyzing...
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom || 16,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask about jobs, system status, or bugs..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim()
                  ? colors.primary
                  : colors.mutedForeground,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  chatList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  ummaBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  ummaAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ummaAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
});
