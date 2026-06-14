import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getCachedJob, FirebaseJob } from "@/hooks/useFirebaseJobs";
import { ref, get, set, push } from "firebase/database";
import { db, auth } from "../../utils/firebase";
import { robustApiClient } from "../../utils/robustApiClient";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { StatusBar } from "expo-status-bar";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "N/A";
  }
}

export default function JobDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<any>(() => id ? getCachedJob(id) : null);
  const [loading, setLoading] = useState(!job);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      
      // 1. Try local SQLite API backend first
      try {
        const baseUrl = robustApiClient.getBaseUrl();
        const response = await fetch(`${baseUrl}/api/jobs/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.job_id) {
            setJob(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log("Local backend details fetch fallback to Firebase:", err);
      }

      // 2. Fallback to Firebase
      try {
        const categories = ['category_central_govt', 'category_state_govt', 'category_private', 'internship', 'freelance'];
        for (const cat of categories) {
          const snapshot = await get(ref(db, `jobs/${cat}/${id}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setJob({
              ...data,
              category: cat,
              job_id: data.job_id || id,
              lastDate: data.lastDate || data.last_date
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching job:", err);
      }

      // 3. Fallback to cache
      const cached = getCachedJob(id);
      if (cached) setJob(cached);
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!auth?.currentUser || !id) return;
      try {
        const sanitizedId = String(id).replace(/[\.\$#\[\]\/]/g, "_");
        const savedSnap = await get(ref(db, `saved_jobs/${auth.currentUser.uid}/${sanitizedId}`));
        setIsSaved(savedSnap.exists());
        const appliedSnap = await get(ref(db, `applications/${auth.currentUser.uid}`));
        if (appliedSnap.exists()) {
          const apps = appliedSnap.val();
          const alreadyApplied = Object.values(apps).some((a: any) => a.job_id === id);
          setIsApplied(alreadyApplied);
        }
      } catch (e) {}
    };
    checkStatus();
  }, [id]);

  const handleSave = async () => {
    if (!auth?.currentUser || !job) {
      Alert.alert("Login Required", "Please sign in to save jobs.");
      return;
    }
    setSaving(true);
    const sanitizedId = String(id).replace(/[\.\$#\[\]\/]/g, "_");
    const saveRef = ref(db, `saved_jobs/${auth.currentUser.uid}/${sanitizedId}`);
    try {
      if (isSaved) {
        await set(saveRef, null);
        setIsSaved(false);
      } else {
        await set(saveRef, JSON.parse(JSON.stringify(job)));
        setIsSaved(true);
      }
    } catch (e) {
      Alert.alert("Error", "Could not update saved status.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${job.organization}\nApply here: ${job.apply_link || job.link}`,
        title: 'Job India',
      });
    } catch (error) {}
  };

  const handleApply = async () => {
    if (!auth?.currentUser) {
      Alert.alert("Login Required", "Please sign in to apply.");
      return;
    }
    if (!job) return;
    const targetLink = job.apply_link || job.link || job.applyUrl;
    if (!targetLink || targetLink === "#") {
      Alert.alert("Unavailable", "Official link is not ready.");
      return;
    }

    const openPortal = async () => {
      try {
        if (!isApplied) {
          if (!auth.currentUser) return;
          const appRef = ref(db, `applications/${auth.currentUser.uid}`);
          await push(appRef, {
            job_id:       id,
            title:        job.title,
            organization: job.organization,
            location:     job.location || job.state || "India",
            salary:       job.salary || job.salaryMin || null,
            job_type:     job.job_type || job.jobType || null,
            applied_at:   Date.now(),
            status:       "Applied",
            category:     job.category,
          });
          setIsApplied(true);
        }
        const url = targetLink.startsWith('http') ? targetLink : `https://${targetLink}`;
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert("Error", "Could not open portal.");
      }
    };

    if (job.link_status === 'broken' || job.link_status === 'expired') {
      Alert.alert(
        "Application Inactive",
        "The automated validation system reports that this recruitment has expired or the portal is temporarily down. Do you still want to proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed Anyway", onPress: openPortal }
        ]
      );
      return;
    }

    await openPortal();
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!job) return <View style={styles.centered}><Text>Job not found</Text></View>;

  const isGov = String(job.category || "").includes('_govt');

  return (
    <View style={[styles.container, { backgroundColor: '#F4F7FE' }]}>
      <StatusBar style="light" translucent />

      {/* Immersive Header */}
      <View style={[styles.immersiveHeader, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.blurCircle}>
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleShare} style={styles.blurCircle}>
              <Feather name="share-2" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.blurCircle, isSaved && styles.activeSave]}>
              <Feather name="bookmark" size={18} color={isSaved ? "#FBBF24" : "#fff"} fill={isSaved ? "#FBBF24" : "none"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.categoryRow}>
            <View style={[styles.statusChip, { backgroundColor: isGov ? '#10B981' : 'rgba(255,255,255,0.2)' }]}>
               <Text style={styles.statusChipText}>{isGov ? "GOVERNMENT" : "PRIVATE SECTOR"}</Text>
            </View>
            <View style={styles.timeBadge}>
               <Feather name="clock" size={10} color="rgba(255,255,255,0.8)" />
               <Text style={styles.timeBadgeText}>Posted recently</Text>
            </View>
          </View>
          <Text style={styles.heroTitle} numberOfLines={3}>{job.title}</Text>
          <View style={styles.companyLink}>
            <View style={styles.companyLogo}>
              <Text style={styles.logoInitial}>{job.organization.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.companyNameText}>{job.organization}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Specification Grid */}
        <View style={styles.mainGrid}>
          <View style={styles.gridColumn}>
            <SpecCard icon="map-pin" label="Location" value={job.location || "India"} color="#6366F1" />
            <SpecCard icon="credit-card" label="Salary" value={(job.salary && job.salary !== 'N/A') ? job.salary : "Standard"} color="#10B981" />
          </View>
          <View style={styles.gridColumn}>
            <SpecCard icon="calendar" label="Deadline" value={formatDate(job.lastDate)} color="#F43F5E" isHighlight />
            <SpecCard icon="briefcase" label="Mode" value={job.job_type || "Full Time"} color="#F59E0B" />
          </View>
        </View>

        {/* Application Security & Verification telemetry card */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accentBar, { backgroundColor: '#10B981' }]} />
            <Text style={styles.sectionTitle}>Application Security</Text>
          </View>
          <View style={styles.whiteCard}>
            {job.is_link_verified === 1 ? (
              <View style={styles.verificationRow}>
                <View style={[styles.secBadge, { backgroundColor: '#E6FBF3' }]}>
                  <Feather name="shield" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationTitle}>Verified Official Portal</Text>
                  <Text style={styles.verificationDesc}>
                    This link is verified to direct safely to the official government or employer application portal. Apply with full confidence.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.verificationRow}>
                <View style={[styles.secBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Feather name="help-circle" size={18} color="#64748B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verificationTitle, { color: '#64748B' }]}>Aggregated External Link</Text>
                  <Text style={styles.verificationDesc}>
                    This link was aggregated from public search feeds. Please review the destination address carefully before entering sensitive data.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.statusDivider} />
            <View style={styles.statusDetailRow}>
              <Feather 
                name={job.link_status === 'active' ? "check-circle" : (job.link_status === 'broken' || job.link_status === 'expired' ? "alert-triangle" : "help-circle")} 
                size={13} 
                color={job.link_status === 'active' ? "#10B981" : (job.link_status === 'broken' || job.link_status === 'expired' ? "#EF4444" : "#F59E0B")} 
              />
              <Text style={styles.statusDetailText}>
                Status: {job.link_status === 'active' ? 'Link Live & Functional' : (job.link_status === 'broken' ? 'Application URL Broken' : (job.link_status === 'expired' ? 'Circular Expired' : 'Validity Unchecked'))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accentBar, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.sectionTitle}>Job Summary</Text>
          </View>
          <View style={styles.whiteCard}>
            <Text style={styles.descriptionBody}>{job.description || "Detailed recruitment circular available in PDF."}</Text>
          </View>
        </View>

        {/* PDF Notification (Moved to bottom) */}
        {job.notification_link && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => Linking.openURL(job.notification_link)} style={styles.pdfBanner}>
            <View style={styles.pdfIconBox}>
              <Feather name="file-text" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pdfTitle}>Official Notification PDF</Text>
              <Text style={styles.pdfSub}>Download for full details & rules</Text>
            </View>
            <Feather name="download" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Footer (Higher up from native bar) */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity activeOpacity={0.8} style={[styles.premiumApplyBtn, { backgroundColor: isApplied ? '#059669' : colors.primary }]} onPress={handleApply}>
          <View style={styles.btnContent}>
            <Text style={styles.btnLabel}>{isApplied ? "SUBMITTED" : "APPLY NOW"}</Text>
            <Feather name={isApplied ? "check" : "chevron-right"} size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SpecCard({ icon, label, value, color, isHighlight }: any) {
  return (
    <View style={[styles.specItem, isHighlight && styles.highlightSpec]}>
      <View style={[styles.specIconFrame, { backgroundColor: color + '12' }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={[styles.specValue, isHighlight && { color: '#E11D48' }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  immersiveHeader: { paddingHorizontal: 16, paddingBottom: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  blurCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  activeSave: { backgroundColor: 'rgba(251,191,36,0.3)' },
  heroContent: { marginTop: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusChipText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24 },
  companyLink: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  companyLogo: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logoInitial: { fontSize: 12, fontWeight: '900', color: '#1E293B' },
  companyNameText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  contentScroll: { flex: 1 },
  mainGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: -15 },
  gridColumn: { flex: 1, gap: 10 },
  specItem: { backgroundColor: '#fff', padding: 12, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  highlightSpec: { borderWidth: 1, borderColor: '#FEE2E2' },
  specIconFrame: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  specLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  specValue: { fontSize: 12, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  pdfBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 20, padding: 14, backgroundColor: '#1E293B', borderRadius: 20, gap: 12 },
  pdfIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  pdfTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  pdfSub: { color: '#94A3B8', fontSize: 10, marginTop: 1 },
  detailSection: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  accentBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: '#3B82F6' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  whiteCard: { backgroundColor: '#fff', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#EDF2F7' },
  detailText: { fontSize: 13, color: '#334155', fontWeight: '600', lineHeight: 18 },
  descriptionBody: { fontSize: 13, color: '#475569', lineHeight: 20 },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24 },
  premiumApplyBtn: { height: 56, borderRadius: 20, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
  btnContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  btnLabel: { color: '#fff', fontSize: 15, fontWeight: '900' },
  verificationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  verificationDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  secBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 10,
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
});
