import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Language =
  | "English"
  | "Hindi"
  | "Bengali"
  | "Telugu"
  | "Tamil"
  | "Marathi"
  | "Gujarati"
  | "Kannada";
export type ThemeMode = "light" | "dark" | "system";
export type JobType =
  | "full-time"
  | "part-time"
  | "remote"
  | "internship"
  | "freelance";
export type Industry =
  | "IT"
  | "Banking"
  | "Civil Services"
  | "Railways"
  | "Defence"
  | "Healthcare"
  | "Education"
  | "Sales"
  | "Marketing"
  | "Construction";

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newJobAlerts: boolean;
  applicationStatus: boolean;
  platformUpdates: boolean;
}

interface AppConfig {
  language: Language;
  themeMode: ThemeMode;
}

interface JobPreferences {
  jobTypes: JobType[];
  preferredLocations: string[];
  salaryMin: number;
  salaryMax: number;
  preferredIndustries: Industry[];
}

interface PrivacySettings {
  resumeVisibility: "public" | "private";
  blockedCompanies: string[];
}

interface Settings {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: NotificationSettings;
  appConfig: AppConfig;
  jobPreferences: JobPreferences;
  privacy: PrivacySettings;
}

interface SettingsContextType {
  settings: Settings;
  updateTheme: (theme: Settings["theme"]) => void;
  updateLanguage: (lang: string) => void;
  updateNotifications: (partial: Partial<NotificationSettings>) => void;
  updateAppConfig: (partial: Partial<AppConfig>) => void;
  updateJobPreferences: (partial: Partial<JobPreferences>) => void;
  updatePrivacy: (partial: Partial<PrivacySettings>) => void;
  clearCache: () => Promise<void>;
}

function normalizeSettings(raw: Partial<Settings>): Settings {
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...raw,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(raw.notifications ?? {}),
    },
    appConfig: {
      ...DEFAULT_SETTINGS.appConfig,
      ...(raw.appConfig ?? {}),
    },
    jobPreferences: {
      ...DEFAULT_SETTINGS.jobPreferences,
      ...(raw.jobPreferences ?? {}),
    },
    privacy: {
      ...DEFAULT_SETTINGS.privacy,
      ...(raw.privacy ?? {}),
    },
  };

  const resolvedTheme =
    raw.appConfig?.themeMode ?? raw.theme ?? DEFAULT_SETTINGS.theme;

  return {
    ...merged,
    theme: resolvedTheme,
    appConfig: {
      ...merged.appConfig,
      themeMode: resolvedTheme,
    },
  };
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  language: "en",
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    newJobAlerts: true,
    applicationStatus: true,
    platformUpdates: true,
  },
  appConfig: {
    language: "English",
    themeMode: "system",
  },
  jobPreferences: {
    jobTypes: ["full-time"],
    preferredLocations: [],
    salaryMin: 0,
    salaryMax: 999999,
    preferredIndustries: [],
  },
  privacy: {
    resumeVisibility: "public",
    blockedCompanies: [],
  },
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateTheme: () => {},
  updateLanguage: () => {},
  updateNotifications: () => {},
  updateAppConfig: () => {},
  updateJobPreferences: () => {},
  updatePrivacy: () => {},
  clearCache: async () => {},
});

const STORAGE_KEY = "job_india_settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw: string | null) => {
      if (raw) {
        try {
          setSettings(normalizeSettings(JSON.parse(raw)));
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    });
  }, []);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    const normalized = normalizeSettings(newSettings);
    setSettings(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const updateTheme = useCallback(
    (theme: Settings["theme"]) => {
      saveSettings({
        ...settings,
        theme,
        appConfig: {
          ...settings.appConfig,
          themeMode: theme,
        },
      });
    },
    [settings, saveSettings],
  );

  const updateLanguage = useCallback(
    (language: string) => {
      saveSettings({ ...settings, language });
    },
    [settings, saveSettings],
  );

  const updateNotifications = useCallback(
    (partial: Partial<NotificationSettings>) => {
      saveSettings({
        ...settings,
        notifications: { ...settings.notifications, ...partial },
      });
    },
    [settings, saveSettings],
  );

  const updateAppConfig = useCallback(
    (partial: Partial<AppConfig>) => {
      const nextTheme = partial.themeMode ?? settings.appConfig.themeMode;

      saveSettings({
        ...settings,
        theme: nextTheme,
        appConfig: { ...settings.appConfig, ...partial, themeMode: nextTheme },
      });
    },
    [settings, saveSettings],
  );

  const updateJobPreferences = useCallback(
    (partial: Partial<JobPreferences>) => {
      saveSettings({
        ...settings,
        jobPreferences: { ...settings.jobPreferences, ...partial },
      });
    },
    [settings, saveSettings],
  );

  const updatePrivacy = useCallback(
    (partial: Partial<PrivacySettings>) => {
      saveSettings({
        ...settings,
        privacy: { ...settings.privacy, ...partial },
      });
    },
    [settings, saveSettings],
  );

  const clearCache = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateTheme,
        updateLanguage,
        updateNotifications,
        updateAppConfig,
        updateJobPreferences,
        updatePrivacy,
        clearCache,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
