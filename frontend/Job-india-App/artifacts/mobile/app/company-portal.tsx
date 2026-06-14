import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { robustApiClient } from "@/utils/robustApiClient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const COMPANY_SESSION_KEY = "job_india_company_session";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Company {
  id: string | number;
  company_name: string;
  company_id: string;
  email?: string;
}

interface CompanyJob {
  id: number;
  title: string;
  location: string;
  salary: string;
  job_type: string;
  last_date: string;
  fetched_at?: string;
}

interface JobForm {
  title: string;
  organization: string;
  location: string;
  salary: string;
  job_type: string;
  description: string;
  last_date: string;
  link: string;
}

const EMPTY_FORM: JobForm = {
  title: "",
  organization: "",
  location: "",
  salary: "",
  job_type: "Full Time",
  description: "",
  last_date: "",
  link: "",
};

const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Remote", "Internship"];

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function CompanyPortalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const [view, setView] = useState<"login" | "register" | "dashboard">("login");
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [jobForm, setJobForm] = useState<JobForm>(EMPTY_FORM);
  const [postLoading, setPostLoading] = useState(false);

  // Login form
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({
    company_name: "",
    company_id: "",
    password: "",
    email: "",
    phone: "",
    website: "",
  });

  // ─── Check existing session on mount ──────────────────────────────────────
  useEffect(() => {
    checkSession();
  }, []);

  // Helper: make authenticated request with company ID header
  const authRequest = useCallback(async (path: string, opts?: RequestInit, compId?: string | number) => {
    const id = compId || company?.id;
    const baseUrl = robustApiClient.getBaseUrl();
    const res = await fetch(`${baseUrl}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(id ? { "X-Company-Id": String(id) } : {}),
        ...((opts?.headers as Record<string, string>) || {}),
      },
    });
    return res.json();
  }, [company?.id]);

  const checkSession = async () => {
    try {
      // First check AsyncStorage (mobile session persistence)
      const stored = await AsyncStorage.getItem(COMPANY_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.company_id) {
          setCompany(parsed);
          setView("dashboard");
          loadDashboardWithId(parsed.id);
          return;
        }
      }
    } catch {}
  };

  // ─── Load dashboard data ───────────────────────────────────────────────────
  const loadDashboardWithId = useCallback(async (id: string | number) => {
    try {
      const baseUrl = robustApiClient.getBaseUrl();
      const [jobsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/company/jobs`, {
          headers: { "X-Company-Id": String(id) },
        }).then(r => r.json()),
        fetch(`${baseUrl}/api/company/${id}/application-stats`).then(r => r.json()),
      ]);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
  }, []);

  const loadDashboard = useCallback(async (compId?: string | number) => {
    const id = compId || company?.id;
    if (!id) return;
    loadDashboardWithId(id);
  }, [company?.id, loadDashboardWithId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // ─── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginId.trim() || !loginPw.trim()) {
      Alert.alert("Error", "Company ID aur password dono required hain.");
      return;
    }
    setLoading(true);
    try {
      const baseUrl = robustApiClient.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/company/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: loginId.trim(), password: loginPw }),
      }).then(r => r.json());

      if (res?.success && res?.company) {
        // ✅ Save to AsyncStorage for persistent session
        await AsyncStorage.setItem(COMPANY_SESSION_KEY, JSON.stringify(res.company));
        setCompany(res.company);
        setView("dashboard");
        loadDashboardWithId(res.company.id);
      } else {
        const errMsg = res?.error || res?.message || "Invalid Company ID ya password.";
        Alert.alert("Login Failed ❌", errMsg);
      }
    } catch (e) {
      Alert.alert("Error", "Server se connect nahi ho paya. Backend running hai?");
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regForm.company_name.trim() || !regForm.company_id.trim() || !regForm.password.trim()) {
      Alert.alert("Error", "Company Name, ID aur Password required hain (*).");
      return;
    }
    if (regForm.password.length < 6) {
      Alert.alert("Error", "Password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    setLoading(true);
    try {
      const baseUrl = robustApiClient.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/company/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: regForm.company_name.trim(),
          company_id:   regForm.company_id.trim().toLowerCase(),
          password:     regForm.password,
          email:        regForm.email.trim(),
          phone:        regForm.phone.trim(),
          website:      regForm.website.trim(),
        }),
      }).then(r => r.json());

      if (res?.success) {
        Alert.alert(
          "✅ Registration Successful!",
          `Company "${regForm.company_name}" register ho gayi!\n\nAb apne Company ID aur Password se login karein.`,
          [{ text: "Login Karen →", onPress: () => {
            setLoginId(regForm.company_id.trim().toLowerCase());
            setView("login");
          }}]
        );
        setRegForm({ company_name: "", company_id: "", password: "", email: "", phone: "", website: "" });
      } else {
        const msg = res?.message || "Registration failed.";
        Alert.alert("Error ❌", msg === "Already exists"
          ? "Yeh Company ID pehle se exist karta hai. Koi aur ID try karein."
          : msg
        );
      }
    } catch (e) {
      Alert.alert("Error", "Server se connect nahi ho paya. Backend running hai?");
    } finally {
      setLoading(false);
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    Alert.alert("Logout", "Company portal se logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear AsyncStorage session
            await AsyncStorage.removeItem(COMPANY_SESSION_KEY);
            await robustApiClient.powerfulRequest("/api/company/logout", { method: "POST" });
          } catch {}
          setCompany(null);
          setJobs([]);
          setStats(null);
          setLoginId("");
          setLoginPw("");
          setView("login");
        },
      },
    ]);
  };

  // ─── Post Job ──────────────────────────────────────────────────────────────
  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.location || !jobForm.description) {
      Alert.alert("Error", "Title, Location aur Description required hain.");
      return;
    }
    if (!company?.id) {
      Alert.alert("Error", "Please pehle login karein.");
      return;
    }
    setPostLoading(true);
    try {
      const baseUrl = robustApiClient.getBaseUrl();
      const payload = {
        ...jobForm,
        organization: jobForm.organization || company?.company_name || "",
      };
      const res = await fetch(`${baseUrl}/api/company/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Id": String(company.id),
        },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      if (res?.success) {
        Alert.alert("✅ Job Posted!", "Job successfully post ho gayi aur Job India feed mein add ho gayi!");
        setPostModalVisible(false);
        setJobForm(EMPTY_FORM);
        loadDashboardWithId(company.id);
      } else {
        Alert.alert("Error", res?.message || "Job post nahi ho payi.");
      }
    } catch (e) {
      Alert.alert("Error", "Job post mein error aaya. Backend running hai?");
    } finally {
      setPostLoading(false);
    }
  };

  // ─── Delete Job ────────────────────────────────────────────────────────────
  const handleDeleteJob = (jobId: number, jobTitle: string) => {
    Alert.alert("Job Delete", `"${jobTitle}" delete karna chahte hain?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const baseUrl = robustApiClient.getBaseUrl();
            const res = await fetch(`${baseUrl}/api/company/jobs/${jobId}`, {
              method: "DELETE",
              headers: { "X-Company-Id": String(company?.id || "") },
            }).then(r => r.json());
            if (res?.success) {
              setJobs((prev) => prev.filter((j) => j.id !== jobId));
              Alert.alert("Deleted! ✅", "Job successfully delete ho gayi.");
            } else {
              Alert.alert("Error", res?.message || "Delete failed.");
            }
          } catch {
            Alert.alert("Error", "Delete mein problem aaya.");
          }
        },
      },
    ]);
  };

  // ─── Render Header ─────────────────────────────────────────────────────────
  const renderHeader = () => (
    <LinearGradient
      colors={["#1a237e", "#3949ab", "#1565c0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topPad + 10 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Feather name="briefcase" size={20} color="#FBBF24" />
          <Text style={styles.headerTitle}>Company Portal</Text>
        </View>
        {view === "dashboard" ? (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {view === "dashboard" && company && (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.companyBadge}>
          <View style={styles.companyIconCircle}>
            <Feather name="home" size={22} color="#3949ab" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{company.company_name}</Text>
            <Text style={styles.companyId}>ID: {company.company_id}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );

  // ─── LOGIN VIEW ─────────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(700).springify()} style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Company Login</Text>
            <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
              Apne company portal mein login karein
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Company ID *</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Feather name="briefcase" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Your Company ID"
                  placeholderTextColor={colors.mutedForeground}
                  value={loginId}
                  onChangeText={setLoginId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password *</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, flex: 1 }]}
                  placeholder="Portal Password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPw}
                  value={loginPw}
                  onChangeText={setLoginPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={8}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#1a237e" }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="log-in" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Login Karen</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>YA</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: "#1a237e" }]}
              onPress={() => setView("register")}
            >
              <Feather name="user-plus" size={16} color="#1a237e" />
              <Text style={[styles.secondaryBtnText, { color: "#1a237e" }]}>New Company Register Karein</Text>
            </TouchableOpacity>

            {/* Open Web Portal */}
            <TouchableOpacity
              style={styles.webPortalBtn}
              onPress={() => Linking.openURL(robustApiClient.getCompanyPortalUrl())}
            >
              <LinearGradient
                colors={["#059669", "#10B981"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.webPortalGradient}
              >
                <Feather name="globe" size={16} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.webPortalTitle}>Web Company Portal Kholein</Text>
                  <Text style={styles.webPortalSub}>Full dashboard browser mein</Text>
                </View>
                <Feather name="external-link" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── REGISTER VIEW ──────────────────────────────────────────────────────────
  if (view === "register") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(700).springify()} style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Company Register</Text>
            <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
              Hiring Partner banen – India ka best talent hire karen
            </Text>

            {(["company_name", "company_id", "password", "email", "phone", "website"] as const).map((key) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {key === "company_name" ? "Company Name *"
                    : key === "company_id" ? "Company ID (Unique) *"
                    : key === "password" ? "Portal Password *"
                    : key === "email" ? "Official Email"
                    : key === "phone" ? "Contact Number"
                    : "Website URL"}
                </Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Feather
                    name={
                      key === "company_name" ? "home"
                      : key === "company_id" ? "hash"
                      : key === "password" ? "lock"
                      : key === "email" ? "mail"
                      : key === "phone" ? "phone"
                      : "globe"
                    }
                    size={15}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={
                      key === "company_name" ? "e.g. TCS, Reliance"
                      : key === "company_id" ? "Unique login ID"
                      : key === "password" ? "Strong password"
                      : key === "email" ? "hr@company.com"
                      : key === "phone" ? "+91 XXXXXXXXXX"
                      : "https://www.company.com"
                    }
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={key === "password"}
                    keyboardType={
                      key === "email" ? "email-address"
                      : key === "phone" ? "phone-pad"
                      : key === "website" ? "url"
                      : "default"
                    }
                    autoCapitalize={key === "company_id" || key === "email" || key === "website" ? "none" : "words"}
                    value={regForm[key]}
                    onChangeText={(v) => setRegForm((p) => ({ ...p, [key]: v }))}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#1a237e" }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Register Karen</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.textLink} onPress={() => setView("login")}>
              <Text style={[styles.textLinkText, { color: colors.primary }]}>
                Pehle se account hai? Login Karen
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── DASHBOARD VIEW ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}

      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a237e"]} />}
        ListHeaderComponent={
          <>
            {/* ── Stats Row ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.statsRow}>
              <StatCard
                icon="briefcase" label="Posted Jobs" value={String(jobs.length)}
                color="#1a237e" colors={colors}
              />
              <StatCard
                icon="users" label="Applications"
                value={String(stats?.total_applications ?? 0)}
                color="#059669" colors={colors}
              />
              <StatCard
                icon="eye" label="Profile Views"
                value={String(stats?.profile_views ?? "—")}
                color="#DC2626" colors={colors}
              />
            </Animated.View>

            {/* ── Post New Job Button ── */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.postBtnWrapper}>
              <TouchableOpacity
                style={styles.postJobBtn}
                onPress={() => setPostModalVisible(true)}
                activeOpacity={0.87}
              >
                <LinearGradient
                  colors={["#1a237e", "#3949ab"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.postJobGradient}
                >
                  <Feather name="plus-circle" size={20} color="#fff" />
                  <Text style={styles.postJobText}>Naya Job Post Karen</Text>
                  <Text style={styles.postJobSub}>Job India mein live ho jaegi</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Posted Jobs</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{jobs.length} Total</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
            <View style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.jobCardTop}>
                <View style={styles.jobTypeTag}>
                  <Text style={styles.jobTypeText}>{item.job_type}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteJob(item.id, item.title)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.jobMeta}>
                <View style={styles.jobMetaItem}>
                  <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{item.location}</Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Feather name="credit-card" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{item.salary || "Not disclosed"}</Text>
                </View>
              </View>
              {item.last_date && (
                <View style={styles.deadlineRow}>
                  <Feather name="calendar" size={11} color="#DC2626" />
                  <Text style={styles.deadlineText}>Last Date: {item.last_date}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Koi Job Post Nahi Hui</Text>
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
              Upar "Naya Job Post Karen" button dabake apni pehli job post karein
            </Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Post Job Modal ── */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPostModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Naya Job Post</Text>
            <TouchableOpacity
              onPress={handlePostJob}
              disabled={postLoading}
              style={[styles.modalSaveBtn, { backgroundColor: "#1a237e" }]}
            >
              {postLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Post Karen</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {([
              ["title", "Job Title *", "e.g. Software Engineer", "default"],
              ["organization", "Company Name", company?.company_name || "Your Company", "words"],
              ["location", "Location *", "e.g. Delhi, Remote, Bangalore", "words"],
              ["salary", "Salary / CTC", "e.g. ₹5-8 LPA", "default"],
              ["link", "Apply Link", "https://your-apply-link.com", "url"],
              ["last_date", "Last Date", "YYYY-MM-DD e.g. 2026-08-31", "default"],
            ] as [keyof JobForm, string, string, string][]).map(([key, label, placeholder, kbType]) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={kbType as any}
                  autoCapitalize={kbType === "url" ? "none" : "sentences"}
                  value={jobForm[key]}
                  onChangeText={(v) => setJobForm((p) => ({ ...p, [key]: v }))}
                />
              </View>
            ))}

            {/* Job Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {JOB_TYPES.map((jt) => (
                  <TouchableOpacity
                    key={jt}
                    style={[styles.typeChip, jobForm.job_type === jt && styles.typeChipActive]}
                    onPress={() => setJobForm((p) => ({ ...p, job_type: jt }))}
                  >
                    <Text style={[styles.typeChipText, jobForm.job_type === jt && styles.typeChipTextActive]}>
                      {jt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Description *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Job ki details, responsibilities, requirements..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={5}
                value={jobForm.description}
                onChangeText={(v) => setJobForm((p) => ({ ...p, description: v }))}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + "15" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  logoutBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 },
  companyBadge: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 12 },
  companyIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  companyName: { fontSize: 16, fontWeight: "800", color: "#fff" },
  companyId: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 1 },

  scrollContent: { padding: 20 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
  formTitle: { fontSize: 22, fontWeight: "900", marginBottom: 6 },
  formSub: { fontSize: 13, lineHeight: 19, marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  inputIcon: {},
  input: { flex: 1, fontSize: 15 },

  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 56, borderRadius: 16, marginTop: 8, elevation: 3, shadowColor: "#1a237e", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16, borderWidth: 1.5, marginTop: 10 },
  secondaryBtnText: { fontSize: 15, fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  textLink: { alignItems: "center", marginTop: 14 },
  textLinkText: { fontSize: 14, fontWeight: "700" },

  webPortalBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden", elevation: 3, shadowColor: "#059669", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
  webPortalGradient: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  webPortalTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  webPortalSub: { color: "rgba(255,255,255,0.8)", fontSize: 11 },

  // Dashboard
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, borderWidth: 1, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  statIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },

  postBtnWrapper: { paddingHorizontal: 16, paddingTop: 16 },
  postJobBtn: { borderRadius: 18, overflow: "hidden", elevation: 4, shadowColor: "#1a237e", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  postJobGradient: { flexDirection: "row", alignItems: "center", padding: 18, gap: 12 },
  postJobText: { fontSize: 17, fontWeight: "800", color: "#fff", flex: 1 },
  postJobSub: { fontSize: 11, color: "rgba(255,255,255,0.75)" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  sectionCount: { fontSize: 13, fontWeight: "700" },

  listContent: { paddingHorizontal: 16 },
  jobCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  jobCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  jobTypeTag: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  jobTypeText: { color: "#1a237e", fontSize: 11, fontWeight: "800" },
  deleteBtn: { padding: 4 },
  jobTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10, lineHeight: 22 },
  jobMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  jobMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  jobMetaText: { fontSize: 12, fontWeight: "600" },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  deadlineText: { fontSize: 11, color: "#DC2626", fontWeight: "700" },

  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  emptyNote: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Modal
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  modalSaveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  modalScroll: { padding: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  typeRow: { marginTop: 4 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd", marginRight: 10 },
  typeChipActive: { backgroundColor: "#1a237e", borderColor: "#1a237e" },
  typeChipText: { fontSize: 13, fontWeight: "700", color: "#666" },
  typeChipTextActive: { color: "#fff" },
});
