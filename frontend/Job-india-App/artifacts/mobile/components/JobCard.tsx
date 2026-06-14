import { Feather } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export interface JobCardJob {
  id: string;
  title: string;
  organization: string;
  category: string;
  location: string;
  country: string;
  state: string | null;
  vacancies: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  lastDate: string;
  tags: string[];
  isSaved: boolean;
  hasApplied: boolean;
  postedAt?: number;
  is_link_verified?: number;
  link_status?: string;
}

interface JobCardProps {
  job: JobCardJob;
  onPress: () => void;
  onSave?: () => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  central_govt: { label: "Govt Job", color: "#1E40AF", bg: "#EFF6FF", icon: "🏛️" },
  category_central_govt: { label: "Govt Job", color: "#1E40AF", bg: "#EFF6FF", icon: "🏛️" },
  state_govt: { label: "State Job", color: "#065F46", bg: "#ECFDF5", icon: "🏢" },
  category_state_govt: { label: "State Job", color: "#065F46", bg: "#ECFDF5", icon: "🏢" },
  private: { label: "Private", color: "#7C3AED", bg: "#F5F3FF", icon: "💼" },
  category_private: { label: "Private", color: "#7C3AED", bg: "#F5F3FF", icon: "💼" },
  internship: { label: "Internship", color: "#B45309", bg: "#FFFBEB", icon: "🎓" },
  applied: { label: "Applied", color: "#059669", bg: "#F0FDF4", icon: "✅" },
};

function getTimeAgo(timestamp?: number): string {
  if (!timestamp) return "New";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  return "Just now";
}

const ORG_SHORT_NAMES: Record<string, string> = {
  "Tripura Public Service Commission": "TPSC",
  "Joint Recruitment Board of Tripura": "JRBT",
  "Tripura Tribal Areas Autonomous District Council": "TTAADC",
  "Staff Selection Commission": "SSC",
  "Union Public Service Commission": "UPSC",
  "Tripura State Rifles": "TSR",
  "Rural Development Department": "RDD",
  "National Health Mission": "NHM",
};

function getShortOrgName(name: string): string {
  if (!name) return "Company";

  // 1. Check direct mapping
  if (ORG_SHORT_NAMES[name]) return ORG_SHORT_NAMES[name];

  // 2. If name is long (more than 3 words), create acronym
  const words = name.split(/\s+/).filter(w => w.length > 0 && !["of", "and", "the", "in"].includes(w.toLowerCase()));
  if (words.length >= 3) {
    return words.map(w => w[0].toUpperCase()).join("");
  }

  return name;
}

const JobCard = memo(({ job, onPress, onSave }: JobCardProps) => {
  const colors = useColors();
  const catConfig = CATEGORY_CONFIG[job.category] ?? CATEGORY_CONFIG.private;

  const isGov = job.category.includes('govt');
  const timeAgo = getTimeAgo(job.postedAt);
  const shortOrgName = getShortOrgName(job.organization);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: catConfig.bg }]}>
          <Text style={[styles.typeBadgeText, { color: catConfig.color }]}>
            {catConfig.icon} {catConfig.label}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {job.is_link_verified === 1 && (
            <View style={styles.officialPill}>
              <Feather name="shield" size={9} color="#10B981" />
              <Text style={styles.officialPillText}>OFFICIAL</Text>
            </View>
          )}
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>

      <View style={styles.mainInfo}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {job.title}
          </Text>
          <View style={styles.orgRow}>
            <Text style={[styles.orgName, { color: colors.primary }]} numberOfLines={1}>
              {shortOrgName}
            </Text>
            {isGov && (
              <View style={styles.verifiedIcon}>
                <Feather name="check-circle" size={10} color="#10b981" />
              </View>
            )}
          </View>
        </View>

        {onSave && (
          <TouchableOpacity
            onPress={onSave}
            style={[styles.saveBtn, job.isSaved && { backgroundColor: '#FEF3C7' }]}
          >
            <Feather
              name="bookmark"
              size={18}
              color={job.isSaved ? "#D97706" : colors.mutedForeground}
              fill={job.isSaved ? "#F59E0B" : "none"}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.locationStrip}>
        <View style={styles.locItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.locText, { color: colors.mutedForeground }]}>{job.location}</Text>
        </View>
        <View style={styles.locItem}>
          <Feather name="briefcase" size={12} color={colors.mutedForeground} />
          <Text style={[styles.locText, { color: colors.mutedForeground }]}>Full-time</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgName: {
    fontSize: 13,
    fontWeight: '600',
  },
  verifiedIcon: {
    backgroundColor: '#10b98115',
    padding: 2,
    borderRadius: 4,
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  locationStrip: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  locItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locText: {
    fontSize: 12,
    fontWeight: '500',
  },
  officialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6FBF3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  officialPillText: {
    color: '#047857',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});

export default JobCard;
