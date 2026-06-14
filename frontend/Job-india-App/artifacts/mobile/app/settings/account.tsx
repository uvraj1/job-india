import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { get, ref, remove } from "firebase/database";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/utils/localization";
import { auth, db } from "../../utils/firebase";

function getFriendlyErrorMessage(error: any, fallback: string): string {
  switch (error?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect. Please try again.";
    case "auth/weak-password":
      return "New password must be at least 6 characters long.";
    case "auth/requires-recent-login":
      return "For security reasons, please sign in again and try once more.";
    default:
      return fallback;
  }
}

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.appConfig.language);

  const [loading, setLoading] = useState(true);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const currentUser = auth?.currentUser ?? null;
  const hasPasswordProvider = useMemo(
    () =>
      currentUser?.providerData?.some(
        (provider: any) => provider.providerId === "password",
      ) ?? false,
    [currentUser],
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setEmail(user.email || currentUser?.email || "");

      try {
        const snapshot = await get(ref(db, `profiles/${user.id}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setEmail(data.email || user.email || currentUser?.email || "");
        }
      } catch (error) {
        console.error("Load account error:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentUser?.email, user?.email, user?.id]);

  const handleChangePassword = async () => {
    if (!currentUser) return;

    if (!hasPasswordProvider) {
      Alert.alert(
        "Not Available",
        "Your account is signed in via Google/provider. Password changes are managed by that provider.",
      );
      return;
    }

    if (!currentUser.email) {
      Alert.alert("Error", "Email account information is missing.");
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert("Required", "Please enter your current password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert(
        "Weak Password",
        "New password must be at least 6 characters long.",
      );
      return;
    }

    setSecuritySaving(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword.trim());
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Success", "Password changed successfully.");
    } catch (error: any) {
      console.error("Change password error:", error);
      Alert.alert(
        "Error",
        getFriendlyErrorMessage(error, "Password change failed."),
      );
    } finally {
      setSecuritySaving(false);
    }
  };

  const performDelete = async () => {
    if (!currentUser || !user?.id) return;

    if (hasPasswordProvider && !currentPassword.trim()) {
      Alert.alert(
        "Required",
        "Please enter your current password before deleting your account.",
      );
      return;
    }

    setDeleting(true);
    try {
      if (hasPasswordProvider && currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword,
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      await Promise.all([
        remove(ref(db, `profiles/${user.id}`)),
        remove(ref(db, `saved_jobs/${user.id}`)),
        remove(ref(db, `applications/${user.id}`)),
      ]);

      await deleteUser(currentUser);

      Alert.alert(
        "Account deleted",
        "Your account and app data have been deleted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Delete account error:", error);
      Alert.alert(
        "Error",
        getFriendlyErrorMessage(error, "Failed to delete account."),
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (hasPasswordProvider && !currentPassword.trim()) {
      Alert.alert(
        "Required",
        "Please enter your current password before deleting your account.",
      );
      return;
    }

    Alert.alert(
      "Delete Account",
      "Are you sure? Your profile, saved jobs, and applications will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void performDelete();
          },
        },
      ],
    );
  };

  if (loading) {
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
          { paddingTop: insets.top + 8, backgroundColor: colors.primary },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("account_settings")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Login Information
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.mutedForeground,
                },
              ]}
              value={email}
              editable={false}
            />
            <Text
              style={[styles.helperText, { color: colors.mutedForeground }]}
            >
              Email cannot be changed from within the app.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Security
          </Text>

          {hasPasswordProvider ? (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Current Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Current password"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  New Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="New password"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Text
                  style={[styles.helperText, { color: colors.mutedForeground }]}
                >
                  The same current password will also be used for account
                  deletion.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.secondary },
                  securitySaving && styles.disabledBtn,
                ]}
                onPress={handleChangePassword}
                disabled={securitySaving || deleting}
              >
                {securitySaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: colors.muted }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                You are not signed in with a password-based account. Password
                changes are managed by your sign-in provider.
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
            Danger Zone
          </Text>
          <Text
            style={[
              styles.helperText,
              { color: colors.mutedForeground, marginBottom: 16 },
            ]}
          >
            Deleting your account will permanently remove your profile, saved
            jobs, and applied jobs.
            {hasPasswordProvider
              ? " Enter your current password above before continuing."
              : " If you signed in with Google/provider, re-authentication is handled by that provider."}
          </Text>

          <TouchableOpacity
            style={[
              styles.dangerBtn,
              (deleting ||
                securitySaving ||
                (hasPasswordProvider && !currentPassword.trim())) &&
                styles.disabledBtn,
            ]}
            onPress={handleDelete}
            disabled={
              deleting ||
              securitySaving ||
              (hasPasswordProvider && !currentPassword.trim())
            }
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.dangerText}>Delete My Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 8,
  },
  scroll: { padding: 16, gap: 12 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1 },
  helperText: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  primaryBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  infoCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  dangerBtn: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#DC2626",
  },
  dangerText: { color: "#fff", fontWeight: "700" },
  disabledBtn: { opacity: 0.7 },
});
