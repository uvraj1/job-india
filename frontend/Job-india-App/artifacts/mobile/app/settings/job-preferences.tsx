import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useSettings, JobType, Industry } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";

const JOB_TYPES: { key: JobType; label: string; emoji: string }[] = [
  { key: "full-time", label: "Full-time", emoji: "🏢" },
  { key: "part-time", label: "Part-time", emoji: "⏰" },
  { key: "remote", label: "Remote / WFH", emoji: "🏠" },
  { key: "internship", label: "Internship", emoji: "🎓" },
  { key: "freelance", label: "Freelance", emoji: "💼" },
];

const INDUSTRIES: { key: Industry; label: string }[] = [
  { key: "IT", label: "Information Technology" },
  { key: "Banking", label: "Banking & Finance" },
  { key: "Civil Services", label: "Civil Services" },
  { key: "Railways", label: "Indian Railways" },
  { key: "Defence", label: "Defence & Armed Forces" },
  { key: "Healthcare", label: "Healthcare & Medical" },
  { key: "Education", label: "Education & Teaching" },
  { key: "Sales", label: "Sales & Business Dev" },
  { key: "Marketing", label: "Marketing & PR" },
  { key: "Construction", label: "Construction & Infrastructure" },
];

export default function JobPreferencesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateJobPreferences } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const prefs = settings.jobPreferences;
  const [locationInput, setLocationInput] = useState("");

  const toggleJobType = (key: JobType) => {
    const current = prefs.jobTypes;
    const next = current.includes(key) ? current.filter((t: string) => t !== key) : [...current, key];
    if (next.length === 0) return;
    updateJobPreferences({ jobTypes: next });
  };

  const toggleIndustry = (key: Industry) => {
    const current = prefs.preferredIndustries;
    const next = current.includes(key) ? current.filter((i: string) => i !== key) : [...current, key];
    updateJobPreferences({ preferredIndustries: next });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: "#E07B39" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>{t("job_preferences")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Job Types</Text>
          <View style={styles.chipWrap}>
            {JOB_TYPES.map(({ key, label, emoji }) => {
              const selected = prefs.jobTypes.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, { backgroundColor: selected ? colors.secondary : colors.muted }]}
                  onPress={() => toggleJobType(key)}
                >
                  <Text style={{ color: selected ? "#fff" : colors.foreground }}>{emoji} {label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Industries</Text>
          {INDUSTRIES.map(({ key, label }) => {
            const selected = prefs.preferredIndustries.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={styles.industryRow}
                onPress={() => toggleIndustry(key)}
              >
                <Text style={{ color: colors.foreground }}>{label}</Text>
                <Feather name={selected ? "check-square" : "square"} size={20} color={selected ? colors.secondary : colors.border} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  scroll: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  industryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
