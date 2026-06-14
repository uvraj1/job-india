import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JobCard, { type JobCardJob } from "@/components/JobCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { db } from "../../utils/firebase";
import { get, onValue, ref, remove } from "firebase/database";
import { StatusBar } from "expo-status-bar";

type SavedJobRecord = {
  id: string;
  job: Record<string, any>;
};

function normalizeCategory(category?: string | null): string {
  const normalized = String(category ?? "global").replace(/^category_/, "");
  return normalized || "global";
}

function buildSavedJobCard(
  jobId: string,
  job: Record<string, any>,
): JobCardJob {
  if (!job) {
    return {
      id: jobId,
      title: "Deleted Job",
      organization: "Unknown",
      category: "global",
      location: "Unknown",
      country: "India",
      state: null,
      vacancies: null,
      salaryMin: null,
      salaryMax: null,
      lastDate: new Date().toISOString(),
      tags: [],
      isSaved: true,
      hasApplied: false,
    };
  }

  const category = normalizeCategory(job.category);
  const tags = Array.isArray(job.tags)
    ? job.tags.map((tag) => String(tag))
    : [job.is_active === false ? "Closed" : "Saved"];

  return {
    id: job.job_id || job.id || jobId,
    title: job.title || "Untitled Job",
    organization: job.organization || "Company",
    category,
    location: String(job.location || job.state || "India"),
    country: job.country || "India",
    state: job.state || null,
    vacancies: typeof job.vacancies === "number" ? job.vacancies : null,
    salaryMin: typeof job.salaryMin === "number" ? job.salaryMin : null,
    salaryMax: typeof job.salaryMax === "number" ? job.salaryMax : null,
    lastDate: job.lastDate || job.last_date || new Date().toISOString(),
    tags,
    isSaved: true,
    hasApplied: false,
  };
}

export default function SavedJobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSavedJobs = useCallback(async () => {
    if (!user?.id) {
      setSavedJobs([]);
      setIsRefreshing(false);
      setIsLoading(false);
      return;
    }

    try {
      const snapshot = await get(ref(db, `saved_jobs/${user.id}`));
      const data = snapshot.val();
      if (data) {
        const mapped = Object.keys(data).map((key) => ({
          id: key,
          job: data[key],
        }));
        setSavedJobs(mapped);
      } else {
        setSavedJobs([]);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setSavedJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const savedRef = ref(db, `saved_jobs/${user.id}`);

    // Real-time listener for instant updates
    const unsubscribe = onValue(savedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let mapped: SavedJobRecord[] = [];

        if (Array.isArray(data)) {
          // Handle array (numeric indices)
          mapped = data
            .map((item, index) => (item ? { id: String(index), job: item } : null))
            .filter((item): item is SavedJobRecord => item !== null);
        } else {
          // Handle object
          mapped = Object.keys(data).map((key) => ({
            id: key,
            job: data[key],
          }));
        }

        setSavedJobs(mapped.reverse()); // Newest saved first
      } else {
        setSavedJobs([]);
      }
      setIsLoading(false);
      setIsRefreshing(false);
    }, (err) => {
      console.error("Firebase Sync Error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleUnsave = async (jobId: string) => {
    if (!user?.id) return;

    Alert.alert(
      "Remove Job",
      "Do you want to remove this job from your saved list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, `saved_jobs/${user.id}/${jobId}`));
            } catch (error) {
              console.error("Error removing job:", error);
            }
          }
        }
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>{t("saved_jobs")}</Text>
        </View>
        <View style={styles.emptyState}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 16 }]}>Login Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Please sign in to view and save jobs.</Text>
          <TouchableOpacity
            style={[styles.findBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.findBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor={colors.primary} translucent={true} />
      {/* Status Bar Background */}
      <View
        style={{
          height: topPad,
          backgroundColor: colors.primary,
          width: "100%",
          zIndex: 10,
          position: "absolute",
          top: 0,
        }}
      />
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t("saved_jobs")}</Text>
          <View style={styles.badgeCount}>
             <Text style={styles.badgeText}>{savedJobs.length}</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>
          {savedJobs.length === 1 ? "Job bookmarked for later" : "Jobs bookmarked for later"}
        </Text>
      </View>

      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void fetchSavedJobs();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather
                  name="bookmark"
                  size={32}
                  color={colors.mutedForeground}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t("no_saved_jobs") || "No saved jobs"}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
              >
                Jobs you bookmark will appear here instantly.
              </Text>
              <TouchableOpacity
                style={[styles.findBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)")}
              >
                <Text style={styles.findBtnText}>{t("find_jobs") || "Browse Jobs"}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const cardJob = buildSavedJobCard(item.id, item.job);

          return (
            <JobCard
              job={cardJob}
              onPress={() => router.push(`/job/${cardJob.id}` as any)}
              onSave={() => handleUnsave(item.id)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  badgeCount: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: '600' },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  listContent: { paddingVertical: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  findBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  findBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
