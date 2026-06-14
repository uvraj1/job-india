import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import ProfileAvatar from "@/components/ProfileAvatar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import {
  emptyEducation,
  emptyExperience,
  sanitizeEducation,
  sanitizeExperience,
} from "@/utils/profileForm";
import { showAlert } from "@/utils/feedback";
import {
  getProfilePhotoLocally,
  saveProfilePhotoLocally,
} from "@/utils/profilePhoto";
import {
  saveProfileToFirebase,
  getProfileFromFirebase,
} from "@/utils/profileService";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS", "PH"];
const ABOUT_WORD_LIMIT = 250;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function limitWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

export default function ProfileEditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    category: "",
    about: "",
    skills: [] as string[],
    education: [] as any[],
    experience: [] as any[],
    profilePhotoUrl: null as string | null,
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    resumeUrl: "",
    resumeName: "",
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const profile = await getProfileFromFirebase(user.id);
        let photo = profile?.profilePhotoUrl ?? null;
        if (!photo) {
          photo = await getProfilePhotoLocally(user.id);
        }

        if (profile) {
          setForm({
            name: profile.name || user.name || "",
            phone: profile.phone ?? user.phone ?? "",
            dateOfBirth: profile.dateOfBirth ?? "",
            gender: profile.gender ?? "",
            address: profile.address ?? "",
            city: profile.city ?? "",
            state: profile.state ?? "",
            category: profile.category ?? "",
            about: profile.about ?? "",
            skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
            education: profile.education?.length
              ? profile.education.map((e: any) => ({ ...e }))
              : [],
            experience: profile.experience?.length
              ? profile.experience.map((e: any) => ({ ...e }))
              : [],
            profilePhotoUrl: photo,
            portfolioUrl: profile.portfolioUrl ?? "",
            linkedinUrl: profile.linkedinUrl ?? "",
            githubUrl: profile.githubUrl ?? "",
            resumeUrl: profile.resumeUrl ?? "",
            resumeName: profile.resumeName ?? "",
          });
        } else {
          setForm((f) => ({
            ...f,
            name: user.name || "",
            phone: user.phone ?? "",
            profilePhotoUrl: photo,
          }));
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        "Permission needed",
        "Allow photo access to set your profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.25,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;
    setForm((f) => ({ ...f, profilePhotoUrl: uri }));
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setForm((f) => ({
          ...f,
          resumeUrl: asset.uri,
          resumeName: asset.name || "resume.pdf",
        }));
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showAlert("Required", "Please enter your full name.");
      return;
    }

    if (countWords(form.about) > ABOUT_WORD_LIMIT) {
      showAlert(
        "Word limit exceeded",
        `About section can have maximum ${ABOUT_WORD_LIMIT} words.`,
      );
      return;
    }

    if (!user?.id) return;

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth.trim() || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        category: form.category || null,
        about: form.about.trim() || null,
        skills: form.skills,
        education: sanitizeEducation(form.education),
        experience: sanitizeExperience(form.experience),
        profilePhotoUrl: form.profilePhotoUrl,
        portfolioUrl: form.portfolioUrl.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
        resumeUrl: form.resumeUrl || null,
        resumeName: form.resumeName || null,
        email: user.email,
      };

      await saveProfileToFirebase(user.id, payload);
      await saveProfilePhotoLocally(user.id, form.profilePhotoUrl);
      await updateUser({ name: payload.name, phone: payload.phone });

      showAlert("Profile Saved", "All your details are updated.", [
        {
          text: "View Profile",
          onPress: () => router.replace("/(tabs)/profile"),
        },
      ]);
    } catch (err: any) {
      console.error("Save profile error:", err);
      showAlert("Could not save", "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const aboutWordCount = countWords(form.about);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm((f) => ({ ...f, skills: [...f.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      education: f.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const updateExperience = (
    id: string,
    field: string,
    value: string | boolean,
  ) => {
    setForm((f) => ({
      ...f,
      experience: f.experience.map((e) =>
        e.id === id
          ? {
              ...e,
              [field]: value,
              ...(field === "current" && value ? { to: null } : {}),
            }
          : e,
      ),
    }));
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("edit_profile")}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Profile Photo
          </Text>
          <View style={styles.photoRow}>
            <ProfileAvatar
              name={form.name}
              photoUrl={form.profilePhotoUrl}
              size={88}
              backgroundColor={colors.muted}
              textColor={colors.primary}
            />
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.primary }]}
              onPress={pickPhoto}
            >
              <Feather name="camera" size={18} color="#fff" />
              <Text style={styles.photoBtnText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("resume_cv")}
          </Text>
          {form.resumeName ? (
            <View
              style={[
                styles.resumeBox,
                { backgroundColor: colors.muted, borderColor: colors.primary },
              ]}
            >
              <View style={styles.resumeInfo}>
                <Feather name="file-text" size={20} color="#DC2626" />
                <Text
                  style={{ flex: 1, color: colors.foreground }}
                  numberOfLines={1}
                >
                  {form.resumeName}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setForm((f) => ({ ...f, resumeUrl: "", resumeName: "" }))
                  }
                >
                  <Feather
                    name="trash-2"
                    size={18}
                    color={colors.destructive}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadArea} onPress={pickResume}>
              <Feather name="upload-cloud" size={24} color={colors.primary} />
              <Text style={{ color: colors.foreground }}>
                Upload Resume (PDF)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("personal_information")}
          </Text>
          <Field
            label="Email"
            value={user?.email ?? ""}
            onChange={() => {}}
            colors={colors}
            editable={false}
          />
          <Field
            label={t("full_name")}
            value={form.name}
            onChange={(v: string) => setForm((f) => ({ ...f, name: v }))}
            colors={colors}
          />
          <Field
            label={t("mobile")}
            value={form.phone}
            onChange={(v: string) => setForm((f) => ({ ...f, phone: v }))}
            colors={colors}
            keyboardType="phone-pad"
          />
          <Field
            label={t("birth_date")}
            value={form.dateOfBirth}
            onChange={(v: string) => setForm((f) => ({ ...f, dateOfBirth: v }))}
            colors={colors}
            placeholder="YYYY-MM-DD"
          />
          <ChipSelect
            label={t("gender")}
            options={GENDER_OPTIONS}
            value={form.gender}
            onSelect={(g: string) => setForm((f) => ({ ...f, gender: g }))}
            colors={colors}
          />
          <ChipSelect
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onSelect={(c: string) => setForm((f) => ({ ...f, category: c }))}
            colors={colors}
          />
          <Field
            label={t("about")}
            value={form.about}
            onChange={(v: string) =>
              setForm((f) => ({ ...f, about: limitWords(v, ABOUT_WORD_LIMIT) }))
            }
            colors={colors}
            placeholder="Write a short profile summary"
            multiline
          />
          <Text style={[styles.helperNote, { color: colors.mutedForeground }]}>
            {aboutWordCount}/{ABOUT_WORD_LIMIT} words
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Location
          </Text>
          <Field
            label="Address"
            value={form.address}
            onChange={(v: string) => setForm((f) => ({ ...f, address: v }))}
            colors={colors}
            placeholder="House no., street, area"
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v: string) => setForm((f) => ({ ...f, city: v }))}
            colors={colors}
          />
          <Field
            label="State"
            value={form.state}
            onChange={(v: string) => setForm((f) => ({ ...f, state: v }))}
            colors={colors}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Portfolio & Social
          </Text>
          <Field
            label="Portfolio URL"
            value={form.portfolioUrl}
            onChange={(v: string) =>
              setForm((f) => ({ ...f, portfolioUrl: v }))
            }
            colors={colors}
            placeholder="https://yourportfolio.com"
          />
          <Field
            label="LinkedIn URL"
            value={form.linkedinUrl}
            onChange={(v: string) => setForm((f) => ({ ...f, linkedinUrl: v }))}
            colors={colors}
            placeholder="https://linkedin.com/in/you"
          />
          <Field
            label="GitHub URL"
            value={form.githubUrl}
            onChange={(v: string) => setForm((f) => ({ ...f, githubUrl: v }))}
            colors={colors}
            placeholder="https://github.com/you"
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("skills")}
          </Text>
          <View style={styles.skillInputRow}>
            <TextInput
              style={[
                styles.input,
                styles.skillInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Add a skill (e.g. React, Excel)"
              placeholderTextColor={colors.mutedForeground}
              onSubmitEditing={addSkill}
            />
            <TouchableOpacity
              style={[styles.addSmallBtn, { backgroundColor: colors.primary }]}
              onPress={addSkill}
            >
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {form.skills.map((skill) => (
              <View
                key={skill}
                style={[styles.skillChip, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: colors.secondary, fontWeight: "600" }}>
                  {skill}
                </Text>
                <TouchableOpacity
                  onPress={() => removeSkill(skill)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {form.skills.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              No skills added yet
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SectionHeader
            title={t("education")}
            onAdd={() =>
              setForm((f) => ({
                ...f,
                education: [...f.education, emptyEducation()],
              }))
            }
            colors={colors}
          />
          {form.education.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Tap + to add education
            </Text>
          ) : (
            form.education.map((edu, index) => (
              <View
                key={edu.id}
                style={[styles.entryCard, { borderColor: colors.border }]}
              >
                <View style={styles.entryHeader}>
                  <Text
                    style={[styles.entryLabel, { color: colors.foreground }]}
                  >
                    Education {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        education: f.education.filter((e) => e.id !== edu.id),
                      }))
                    }
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={colors.destructive}
                    />
                  </TouchableOpacity>
                </View>
                <Field
                  label="Degree"
                  value={edu.degree}
                  onChange={(v: string) => updateEducation(edu.id, "degree", v)}
                  colors={colors}
                />
                <Field
                  label="Institution"
                  value={edu.institution}
                  onChange={(v: string) =>
                    updateEducation(edu.id, "institution", v)
                  }
                  colors={colors}
                />
                <Field
                  label="Year"
                  value={edu.year}
                  onChange={(v: string) => updateEducation(edu.id, "year", v)}
                  colors={colors}
                  placeholder="e.g. 2024"
                />
                <Field
                  label="Grade / CGPA"
                  value={edu.grade ?? ""}
                  onChange={(v: string) => updateEducation(edu.id, "grade", v)}
                  colors={colors}
                  placeholder="Optional"
                />
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SectionHeader
            title={t("work_experience")}
            onAdd={() =>
              setForm((f) => ({
                ...f,
                experience: [...f.experience, emptyExperience()],
              }))
            }
            colors={colors}
          />
          {form.experience.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Tap + to add work experience
            </Text>
          ) : (
            form.experience.map((exp, index) => (
              <View
                key={exp.id}
                style={[styles.entryCard, { borderColor: colors.border }]}
              >
                <View style={styles.entryHeader}>
                  <Text
                    style={[styles.entryLabel, { color: colors.foreground }]}
                  >
                    Experience {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        experience: f.experience.filter((e) => e.id !== exp.id),
                      }))
                    }
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={colors.destructive}
                    />
                  </TouchableOpacity>
                </View>
                <Field
                  label="Job Title / Role"
                  value={exp.role}
                  onChange={(v: string) => updateExperience(exp.id, "role", v)}
                  colors={colors}
                />
                <Field
                  label="Company"
                  value={exp.company}
                  onChange={(v: string) =>
                    updateExperience(exp.id, "company", v)
                  }
                  colors={colors}
                />
                <Field
                  label="From"
                  value={exp.from}
                  onChange={(v: string) => updateExperience(exp.id, "from", v)}
                  colors={colors}
                  placeholder="e.g. Jan 2022"
                />
                {!exp.current ? (
                  <Field
                    label="To"
                    value={exp.to ?? ""}
                    onChange={(v: string) => updateExperience(exp.id, "to", v)}
                    colors={colors}
                    placeholder="e.g. Dec 2024"
                  />
                ) : null}
                <View style={styles.currentRow}>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                    Currently working here
                  </Text>
                  <Switch
                    value={!!exp.current}
                    onValueChange={(v) =>
                      updateExperience(exp.id, "current", v)
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.secondary,
                    }}
                  />
                </View>
                <Field
                  label="Description"
                  value={exp.description ?? ""}
                  onChange={(v: string) =>
                    updateExperience(exp.id, "description", v)
                  }
                  colors={colors}
                  placeholder="Key responsibilities (optional)"
                  multiline
                />
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBottom, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBottomText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title,
  onAdd,
  colors,
}: {
  title: string;
  onAdd: () => void;
  colors: any;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.foreground, marginBottom: 0 },
        ]}
      >
        {title}
      </Text>
      <TouchableOpacity
        style={[styles.addSmallBtn, { backgroundColor: colors.primary }]}
        onPress={onAdd}
      >
        <Feather name="plus" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  placeholder,
  keyboardType = "default",
  editable = true,
  multiline = false,
}: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.muted,
          },
          !editable && { opacity: 0.7 },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
      />
    </View>
  );
}

function ChipSelect({ label, options, value, onSelect, colors }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.chips}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              {
                backgroundColor: value === opt ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => onSelect(opt)}
          >
            <Text
              style={{ color: value === opt ? "#fff" : colors.mutedForeground }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800" as any,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as any, marginBottom: 12 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  photoBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  photoBtnText: { color: "#fff", fontWeight: "600" as any },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600" as any, marginBottom: 4 },
  helperNote: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  uploadArea: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  resumeBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  resumeInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBottom: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBottomText: { color: "#fff", fontSize: 16, fontWeight: "700" as any },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skillInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  skillInput: { flex: 1 },
  addSmallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryLabel: { fontSize: 14, fontWeight: "700" as any },
  currentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
});
