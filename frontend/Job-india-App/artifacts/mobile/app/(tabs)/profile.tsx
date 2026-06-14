import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { getProfilePhotoLocally } from "@/utils/profilePhoto";
import {
  getProfileFromFirebase,
  calculateProfileScore,
} from "@/utils/profileService";
import { StatusBar } from "expo-status-bar";
import { useSubscription } from "@/context/SubscriptionContext";

function ProfileProgress({ score }: { score: number }) {
  const colors = useColors();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.foreground }]}>
          {t("profile_strength")}
        </Text>
        <Text style={[styles.progressScore, { color: colors.secondary }]}>
          {score}%
        </Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${score}%` as `${number}%`,
              backgroundColor:
                score >= 70
                  ? colors.success
                  : score >= 40
                    ? colors.secondary
                    : colors.destructive,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
        {score >= 70
          ? "Strong profile! You can apply to most jobs."
          : "Complete your profile in Settings → Edit Profile."}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { subscription } = useSubscription();
  const { t } = useTranslation(settings.appConfig.language);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const displayPhoto = profile?.profilePhotoUrl ?? localPhoto;

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getProfileFromFirebase(user.id);
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      if (user?.id) {
        void getProfilePhotoLocally(user.id).then(setLocalPhoto);
      }
    }, [user?.id, loadProfile]),
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 8, backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.headerTitle}>{t("profile")}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const profileScore = profile ? calculateProfileScore(profile) : 0;
  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";

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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 12,
              backgroundColor: colors.primary,
              marginHorizontal: -16,
              marginBottom: 16,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t("profile") || "Profile"}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.settingsBtn,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={() => router.push("/settings")}
              >
                <Feather name="settings" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.avatarRow}>
            <ProfileAvatar
              name={displayName}
              photoUrl={displayPhoto}
              size={64}
            />
            <View style={styles.avatarInfo}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.avatarName}>{displayName}</Text>
                {subscription.isActive && (
                  <View style={styles.proBadge}>
                    <Feather name="award" size={10} color="#FBBF24" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.avatarEmail}>{displayEmail}</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ProfileProgress score={profileScore} />
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: 0,
              overflow: "hidden",
            },
          ]}
        >
          <LinearGradient
            colors={["#4A90E2", "#357ABD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.personalHeader}
          >
            <Feather name="user" size={18} color="#fff" />
            <Text style={styles.personalTitle}>{t("personal_information")}</Text>
          </LinearGradient>

          <View style={styles.infoContent}>
            <View style={styles.infoGrid}>
              <InfoBox
                label={t("full_name")}
                value={displayName}
                icon="user"
                color="#4A90E2"
                colors={colors}
              />
              <InfoBox
                label={t("mobile")}
                value={profile?.phone}
                icon="phone"
                color="#50C878"
                colors={colors}
              />
              <InfoBox
                label={t("birth_date")}
                value={profile?.dateOfBirth}
                icon="calendar"
                color="#FF7F50"
                colors={colors}
              />
              <InfoBox
                label={t("gender")}
                value={profile?.gender}
                icon="users"
                color="#9370DB"
                colors={colors}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color="#E74C3C" />
              <Text style={[styles.addressText, { color: colors.foreground }]}>
                {profile?.address ? `${profile.address}, ` : ""}
                {profile?.city ? `${profile.city}, ` : ""}
                {profile?.state || "Location not set"}
              </Text>
            </View>

            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: "#F0F7FF", borderColor: "#4A90E2" },
              ]}
            >
              <Text
                style={{ color: "#4A90E2", fontWeight: "700", fontSize: 12 }}
              >
                CATEGORY: {profile?.category || "GENERAL"}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.aboutHeaderRow}>
            <Feather name="align-left" size={16} color={colors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginBottom: 0 },
              ]}
            >
              {t("about")}
            </Text>
          </View>

          <View
            style={[
              styles.aboutBox,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.aboutAccent, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.aboutText, { color: colors.foreground }]}>
              {profile?.about?.trim?.() ||
                "Add your career summary in Settings → Edit Profile so recruiters can quickly understand your profile."}
            </Text>
          </View>
        </View>

        {/* Professional Resume Section in Profile View */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("resume_cv")}
          </Text>
          {profile?.resumeUrl ? (
            <TouchableOpacity
              style={[styles.resumeViewBox, { backgroundColor: colors.muted }]}
              onPress={() => Linking.openURL(profile.resumeUrl)}
            >
              <View style={[styles.pdfIcon, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="file-text" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.resumeViewName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {profile.resumeName || "My_Resume.pdf"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.primary }}>
                  Click to view / download
                </Text>
              </View>
              <Feather name="external-link" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyResumeState}>
              <Feather
                name="file-minus"
                size={32}
                color={colors.mutedForeground}
              />
              <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
                No resume uploaded yet
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Portfolio & Social
          </Text>
          <View style={styles.linksGrid}>
            {profile?.portfolioUrl ? (
              <TouchableOpacity
                style={[styles.linkBadge, { backgroundColor: "#F0FDF4" }]}
                onPress={() =>
                  profile.portfolioUrl && Linking.openURL(profile.portfolioUrl)
                }
              >
                <Feather name="globe" size={14} color="#16A34A" />
                <Text style={[styles.linkBadgeText, { color: "#16A34A" }]}>
                  Portfolio
                </Text>
              </TouchableOpacity>
            ) : null}
            {profile?.linkedinUrl ? (
              <TouchableOpacity
                style={[styles.linkBadge, { backgroundColor: "#EFF6FF" }]}
                onPress={() =>
                  profile.linkedinUrl && Linking.openURL(profile.linkedinUrl)
                }
              >
                <Feather name="linkedin" size={14} color="#2563EB" />
                <Text style={[styles.linkBadgeText, { color: "#2563EB" }]}>
                  LinkedIn
                </Text>
              </TouchableOpacity>
            ) : null}
            {profile?.githubUrl ? (
              <TouchableOpacity
                style={[styles.linkBadge, { backgroundColor: "#F8FAFC" }]}
                onPress={() =>
                  profile.githubUrl && Linking.openURL(profile.githubUrl)
                }
              >
                <Feather name="github" size={14} color="#0F172A" />
                <Text style={[styles.linkBadgeText, { color: "#0F172A" }]}>
                  GitHub
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {!profile?.portfolioUrl &&
          !profile?.linkedinUrl &&
          !profile?.githubUrl ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
              No social links added
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("skills")}
          </Text>
          <View style={styles.skillsWrap}>
            {(profile?.skills ?? []).length === 0 ? (
              <Text
                style={[styles.emptyNote, { color: colors.mutedForeground }]}
              >
                No skills added yet
              </Text>
            ) : (
              (profile?.skills ?? []).map((skill: string) => (
                <View
                  key={skill}
                  style={[styles.skillChip, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.skillText, { color: colors.secondary }]}>
                    {skill}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("education")}
          </Text>
          {(profile?.education ?? []).length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
              No education details added.
            </Text>
          ) : (
            (profile?.education ?? []).map((edu: any) => (
              <View
                key={edu.id}
                style={[styles.listItem, { borderColor: colors.border }]}
              >
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                  {edu.degree}
                </Text>
                <Text style={[styles.itemSub, { color: colors.primary }]}>
                  {edu.institution}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.mutedForeground }]}
                >
                  {edu.year}
                  {edu.grade ? ` • ${edu.grade}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("work_experience")}
          </Text>
          {(profile?.experience ?? []).length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
              No work experience added.
            </Text>
          ) : (
            (profile?.experience ?? []).map((exp: any) => (
              <View
                key={exp.id}
                style={[styles.listItem, { borderColor: colors.border }]}
              >
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                  {exp.role}
                </Text>
                <Text style={[styles.itemSub, { color: colors.primary }]}>
                  {exp.company}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.mutedForeground }]}
                >
                  {exp.from} - {exp.current ? "Present" : (exp.to ?? "")}
                </Text>
                {exp.description ? (
                  <Text
                    style={[styles.itemDesc, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {exp.description}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoBox({
  label,
  value,
  icon,
  color,
  colors,
}: {
  label: string;
  value?: string | null;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  colors: any;
}) {
  return (
    <View style={styles.infoBox}>
      <View style={[styles.miniIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon} size={12} color={color} />
      </View>
      <View>
        <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text
          style={[styles.boxValue, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {value || "---"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerActions: { flexDirection: "row", gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  avatarEmail: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  proBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(251,191,36,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: "rgba(251,191,36,0.4)" },
  proBadgeText: { color: "#fbbf24", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 16 },
  section: { borderRadius: 20, padding: 16, borderWidth: 1, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 16 },
  progressContainer: { gap: 10 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 14, fontWeight: "600" as const },
  progressScore: { fontSize: 14, fontWeight: "700" as const },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressHint: { fontSize: 12 },
  personalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  personalTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  infoContent: { padding: 16 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  infoBox: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  boxValue: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 14 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  addressText: { fontSize: 13, fontWeight: "500", flex: 1 },
  categoryBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  aboutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  aboutBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 110,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  aboutAccent: { width: 4, borderRadius: 99, alignSelf: "stretch" },
  aboutText: { flex: 1, fontSize: 14, lineHeight: 22, textAlign: "left" },
  resumeViewBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  pdfIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  resumeViewName: { fontSize: 14, fontWeight: "700" },
  emptyResumeState: { alignItems: "center", paddingVertical: 10 },
  linksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  linkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  linkBadgeText: { fontSize: 13, fontWeight: "700" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  skillText: { fontSize: 13, fontWeight: "600" as const },
  emptyNote: { fontSize: 13 },
  listItem: { borderTopWidth: 1, paddingTop: 12, marginTop: 8 },
  itemTitle: { fontSize: 15, fontWeight: "700" as const, marginBottom: 2 },
  itemSub: { fontSize: 13, fontWeight: "600" as const, marginBottom: 2 },
  itemMeta: { fontSize: 12 },
  itemDesc: { fontSize: 13, marginTop: 4 },
});
