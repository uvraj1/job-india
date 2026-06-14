import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import JobCard from "@/components/JobCard";
import CompanySuggestions from "@/components/CompanySuggestions";
import PremiumBanner from "@/components/PremiumBanner";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import SmartFilter, {
  DEFAULT_FILTER,
  jobMatchesFilter,
  type FilterState,
} from "@/components/SmartFilter";
import { FirebaseJob, useFirebaseJobs } from "@/hooks/useFirebaseJobs";
import { useBackendJobs } from "@/hooks/useBackendJobs";
import { useSettings } from "@/context/SettingsContext";
import { db } from "../../utils/firebase";
import { ref, set, onValue } from "firebase/database";

import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay
} from "react-native-reanimated";

const JOBS_PAGE_SIZE = 1000;

const FAMOUS_JOBS = [
  {
    code: "IAS",
    fullName: "Indian Administrative Service",
    exam: "UPSC CSE",
    level: "Top Civil Service",
    accent: "#2563EB",
    icon: "briefcase" as const,
  },
  {
    code: "IPS",
    fullName: "Indian Police Service",
    exam: "UPSC CSE",
    level: "Police Leadership",
    accent: "#16A34A",
    icon: "shield" as const,
  },
  {
    code: "IFS",
    fullName: "Indian Foreign Service",
    exam: "UPSC CSE",
    level: "Diplomatic Service",
    accent: "#7C3AED",
    icon: "globe" as const,
  },
  {
    code: "IRS",
    fullName: "Indian Revenue Service",
    exam: "UPSC CSE",
    level: "Tax & Customs",
    accent: "#DC2626",
    icon: "database" as const,
  },
  {
    code: "NDA",
    fullName: "National Defence Academy",
    exam: "UPSC NDA",
    level: "Military Officer",
    accent: "#1E293B",
    icon: "target" as const,
  },
  {
    code: "RBI",
    fullName: "RBI Grade B Officer",
    exam: "RBI Exam",
    level: "Central Bank Leader",
    accent: "#0D9488",
    icon: "credit-card" as const,
  },
  {
    code: "ISRO",
    fullName: "ISRO Scientist",
    exam: "ICRB / GATE",
    level: "Space Research",
    accent: "#EA580C",
    icon: "send" as const,
  },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [visibleCount, setVisibleCount] = useState(JOBS_PAGE_SIZE);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // ─── Saved Jobs Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setSavedJobIds(new Set());
      return;
    }
    const savedRef = ref(db, `saved_jobs/${user.id}`);
    const unsubscribe = onValue(savedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSavedJobIds(new Set(Object.keys(data)));
      } else {
        setSavedJobIds(new Set());
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  const toggleSaveJob = useCallback(async (job: FirebaseJob) => {
    if (!user?.id) {
      Alert.alert("Login Required", "Please sign in to save jobs.");
      return;
    }
    const jobId = job.job_id || job.id || "";
    if (!jobId) return;

    // Sanitize ID for Firebase key (dots, $, #, [, ], / are not allowed)
    const sanitizedId = String(jobId).replace(/[\.\$#\[\]\/]/g, "_");

    const isCurrentlySaved = savedJobIds.has(sanitizedId);
    const saveRef = ref(db, `saved_jobs/${user.id}/${sanitizedId}`);

    try {
      if (isCurrentlySaved) {
        await set(saveRef, null);
      } else {
        // Important: Firebase does not allow 'undefined' values.
        // We stringify and parse to strip any undefined fields.
        const jobToSave = JSON.parse(JSON.stringify(job));
        await set(saveRef, jobToSave);
      }
    } catch (e) {
      console.error("Toggle save error:", e);
      Alert.alert("Save Failed", "Could not save job to cloud. Check your connection.");
    }
  }, [user?.id, savedJobIds]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const preferredState = useMemo(() => {
    const firstPreferred = settings?.jobPreferences?.preferredLocations?.[0];
    return String(firstPreferred || "").trim();
  }, [settings?.jobPreferences?.preferredLocations]);

  const { jobs, loading: aggregatorLoading } = useBackendJobs();

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      if (!jobMatchesFilter(job, activeFilters)) return false;

      const jobTitle = (job.title || "").toLowerCase();
      const jobOrg = (job.organization || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      if (!query) return true;
      return jobTitle.includes(query) || jobOrg.includes(query);
    });
  }, [jobs, searchQuery, activeFilters]);

  const orderedJobs = useMemo(() => {
    if (!filteredJobs || filteredJobs.length === 0) return [];

    const normalizedPreferredState = preferredState.toLowerCase();
    const isPreferredStateJob = (job: FirebaseJob) => {
      if (!normalizedPreferredState) return false;
      const state = String(job?.state || "").toLowerCase();
      const location = String(job?.location || "").toLowerCase();
      return state.includes(normalizedPreferredState) || location.includes(normalizedPreferredState);
    };

    const isRemoteJob = (job: FirebaseJob) => {
      const location = String(job?.location || "").toLowerCase();
      const title = String(job?.title || "").toLowerCase();
      const tags = Array.isArray(job?.tags) ? job.tags.map((tag) => String(tag).toLowerCase()) : [];
      const category = String(job?.category || "").toLowerCase();
      return (
        location.includes("remote") ||
        title.includes("remote") ||
        tags.some((tag) => tag.includes("remote") || tag.includes("work from home")) ||
        category.includes("remote")
      );
    };

    const isIntern = (job: FirebaseJob) => {
      const jobTags = Array.isArray(job?.tags) ? job.tags : [];
      return (
        jobTags.some(tag => String(tag).toLowerCase().includes('internship')) ||
        String(job?.title || "").toLowerCase().includes('intern') ||
        job?.category === 'internship'
      );
    };

    const isFreelance = (job: FirebaseJob) => {
      const jobTags = Array.isArray(job?.tags) ? job.tags : [];
      return jobTags.some(tag => String(tag).toLowerCase().includes('freelance')) ||
             String(job?.title || "").toLowerCase().includes('freelance') ||
             job?.category === 'freelance' ||
             (job as any)?.job_class === 'freelance';
    };

    // 1. Separate into groups
    const governmentJobs = filteredJobs.filter((job) =>
      String(job?.category || "").includes('_govt') && !isIntern(job)
    );

    const internshipJobs = filteredJobs.filter(isIntern);

    const freelanceJobs = filteredJobs.filter((job) => {
      const isGov = String(job?.category || "").includes('_govt');
      return !isGov && !isIntern(job) && isFreelance(job);
    });

    const remoteJobs = filteredJobs.filter((job) => {
      const isGov = String(job?.category || "").includes('_govt');
      return !isGov && !isIntern(job) && !isFreelance(job) && isRemoteJob(job);
    });

    const privateJobs = filteredJobs.filter((job) => {
      const isGov = String(job?.category || "").includes('_govt');
      return !isGov && !isIntern(job) && !isFreelance(job) && !isRemoteJob(job);
    });

    // 2. Sort each group by preferred state first, then date (newest first)
    const sortByStateAndDate = (a: FirebaseJob, b: FirebaseJob) => {
      const aStateRank = isPreferredStateJob(a) ? 0 : 1;
      const bStateRank = isPreferredStateJob(b) ? 0 : 1;
      if (aStateRank !== bStateRank) return aStateRank - bStateRank;
      return (Number(b?.posted_at) || 0) - (Number(a?.posted_at) || 0);
    };

    const sortedGov = [...governmentJobs].sort(sortByStateAndDate);
    const sortedPrivate = [...privateJobs].sort(sortByStateAndDate);
    const sortedRemote = [...remoteJobs].sort(sortByStateAndDate);
    const sortedFreelance = [...freelanceJobs].sort(sortByStateAndDate);
    const sortedIntern = [...internshipJobs].sort(sortByStateAndDate);

    // 3. Combine: Gov -> Private -> Remote -> Freelance -> Internship
    return [...sortedGov, ...sortedPrivate, ...sortedRemote, ...sortedFreelance, ...sortedIntern];
  }, [filteredJobs, preferredState]);

  const pagedJobs = useMemo(() => {
    return (orderedJobs || []).slice(0, visibleCount);
  }, [orderedJobs, visibleCount]);

  const hasMoreJobs = visibleCount < (orderedJobs?.length || 0);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setVisibleCount(JOBS_PAGE_SIZE);
  }, [searchQuery, activeFilters]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const handleSearch = () => {
    setSearchQuery(search);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };

  const handleApplyFilters = (f: FilterState) => {
    setActiveFilters(f);
    setFilterVisible(false);
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const renderJobItem = useCallback(({ item, index }: { item: FirebaseJob; index: number }) => {
    const jobId = item.job_id || item.id || "";
    if (!jobId) return null;

    const sanitizedId = String(jobId).replace(/[\.\$#\[\]\/]/g, "_");

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 600)).duration(600).springify()}
      >
        <JobCard
          job={{
            id: jobId,
            title: item.title || "Untitled Job",
            organization: item.organization || "Company",
            category: (item.category || "global").replace("category_", ""),
            location: String(item.state || item.location || "India"),
            country: "India",
            state: item.state || null,
            vacancies: item.vacancies || null,
            salaryMin: item.salaryMin || null,
            salaryMax: item.salaryMax || null,
            lastDate: item.lastDate || new Date().toISOString(),
            tags: Array.isArray(item.tags) ? item.tags : ["Active"],
            isSaved: savedJobIds.has(sanitizedId),
            hasApplied: false,
            is_link_verified: (item as any).is_link_verified ?? 0,
            link_status: (item as any).link_status ?? 'unchecked',
          }}
          onPress={() => {
            router.push(`/job/${jobId}` as any);
          }}
          onSave={() => toggleSaveJob(item)}
        />
      </Animated.View>
    );
  }, [savedJobIds, toggleSaveJob]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ height: topPad, width: "100%", zIndex: 10, position: "absolute", top: 0 }}>
        <LinearGradient
          colors={[colors.primary, "#2C5282", colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      <FlatList
        data={pagedJobs}
        keyExtractor={(item, index) => item.job_id || item.id || `job-${index}`}
        renderItem={renderJobItem}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={[colors.primary, "#2C5282", colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.header, { paddingTop: topPad + 6 }]}
            >
              <View style={styles.headerTop}>
                <Animated.View entering={FadeInLeft.duration(1000).springify()}>
                  <Text style={styles.headerTitle}>Find Your</Text>
                  <Text style={[styles.headerTitle, { color: "#FBBF24", marginTop: -4 }]}>Dream Job</Text>
                </Animated.View>
                <TouchableOpacity
                  style={styles.headerBadge}
                  onPress={() => router.push("/notifications" as any)}
                >
                  <Feather name="bell" size={20} color="#fff" />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search jobs, companies..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={search}
                    onChangeText={(text) => {
                      setSearch(text);
                      setSearchQuery(text);
                      setVisibleCount(10);
                    }}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <Pressable onPress={handleClearSearch} hitSlop={8}>
                      <Feather name="x" size={18} color="rgba(255,255,255,0.7)" />
                    </Pressable>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.filterIconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                  onPress={() => setFilterVisible(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="sliders" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.resultsHeader}>
              <View>
                <Text style={[styles.resultsTitle, { color: colors.foreground }]}>Latest Opportunities</Text>
                <Text style={[styles.resultsSub, { color: colors.mutedForeground }]}>Freshly aggregated for you</Text>
              </View>
              {orderedJobs.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={[styles.countBadgeText, { color: colors.primary }]}>{orderedJobs.length}</Text>
                </View>
              )}
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {hasMoreJobs && !aggregatorLoading && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={handleShowMore}
                activeOpacity={0.7}
              >
                <Text style={[styles.showMoreText, { color: colors.primary }]}>Show More Jobs</Text>
                <Feather name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.foreground }]}>Popular Careers</Text>
              <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>High-status paths in India</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredListContent}>
              {FAMOUS_JOBS.map((job, idx) => (
                <Animated.View
                  key={job.code}
                  entering={FadeInRight.delay(idx * 100).duration(800).springify()}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/career/[code]", params: { code: job.code } } as any)}
                    style={[styles.jobBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.jobBoxTop}>
                      <View style={[styles.iconBadge, { backgroundColor: `${job.accent}15` }]}>
                        <Feather name={job.icon} size={16} color={job.accent} />
                      </View>
                      <View style={[styles.codePill, { backgroundColor: job.accent }]}>
                        <Text style={styles.codePillText}>{job.code}</Text>
                      </View>
                    </View>

                    <View style={styles.jobBoxBody}>
                      <Text style={[styles.fullName, { color: colors.foreground }]} numberOfLines={2}>{job.fullName}</Text>
                      <View style={styles.examTag}>
                        <Text style={[styles.examTagText, { color: job.accent }]}>{job.exam}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>

            <CompanySuggestions />
            <PremiumBanner />
            <View style={{ height: 40 }} />
          </>
        }
        ListEmptyComponent={
          aggregatorLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground, marginTop: 10 }]}>Loading Jobs...</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={{ fontSize: 60, marginBottom: 20 }}>💼</Text>
              <Text style={[styles.loadingText, { color: colors.foreground, fontSize: 18, fontWeight: "700" }]}>No Jobs Found</Text>
            </View>
          )
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      />

      <SmartFilter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={activeFilters}
        onChange={setActiveFilters}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  headerBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  notificationDot: { position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#FF4D4D", borderWidth: 1.5, borderColor: "#2C5282" },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  searchInput: { flex: 1, fontSize: 14, color: "#FFFFFF", fontWeight: "500" },
  filterIconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  listContent: { paddingBottom: 30 },
  featuredListContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 20 },
  jobBox: { width: 160, height: 140, borderWidth: 1, borderRadius: 24, padding: 16, justifyContent: "space-between", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  jobBoxTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codePill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  codePillText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  iconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  jobBoxBody: { gap: 6 },
  fullName: { fontSize: 13, fontWeight: "800", lineHeight: 18 },
  examTag: { alignSelf: 'flex-start' },
  examTagText: { fontSize: 10, fontWeight: "700", textTransform: 'uppercase' },
  resultsHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  resultsTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  resultsSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  countBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countBadgeText: { fontSize: 13, fontWeight: "800" },
  resultsCount: { fontSize: 12, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  loadingText: { fontSize: 15, fontWeight: "600" },
  showMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20, marginHorizontal: 20, marginTop: 10, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", gap: 12 },
  showMoreText: { fontSize: 16, fontWeight: "800" },
});
