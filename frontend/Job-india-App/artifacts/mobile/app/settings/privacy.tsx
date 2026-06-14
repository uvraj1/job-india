import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updatePrivacy } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const privacy = settings.privacy;
  const [companyInput, setCompanyInput] = useState("");

  const isPublic = privacy.resumeVisibility === "public";

  const addBlockedCompany = () => {
    const name = companyInput.trim();
    if (!name) return;
    updatePrivacy({ blockedCompanies: [...privacy.blockedCompanies, name] });
    setCompanyInput("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: "#2D6A4F" }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{t("privacy_visibility")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resume Visibility</Text>
          <View style={styles.switchRow}>
            <Text style={{ color: colors.foreground }}>{isPublic ? "Public" : "Private"}</Text>
            <Switch
              value={isPublic}
              onValueChange={(v) => updatePrivacy({ resumeVisibility: v ? "public" : "private" })}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Block Companies</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Company name..."
              value={companyInput}
              onChangeText={setCompanyInput}
            />
            <TouchableOpacity onPress={addBlockedCompany}><Feather name="plus-circle" size={24} color={colors.primary} /></TouchableOpacity>
          </View>
          {privacy.blockedCompanies.map((c: string) => (
            <View key={c} style={styles.blockedItem}>
              <Text style={{ color: colors.foreground }}>{c}</Text>
              <TouchableOpacity onPress={() => updatePrivacy({ blockedCompanies: privacy.blockedCompanies.filter((bc: string) => bc !== c) })}>
                <Feather name="x-circle" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => Linking.openURL("https://uvraj1.github.io/Privacy-Policy-Job-india/")}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name="external-link" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Read Full Privacy Policy</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 8 },
  scroll: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  input: { flex: 1, padding: 10, borderRadius: 8 },
  blockedItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
