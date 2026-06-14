import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";

type Palette = typeof colors.light;

/**
 * Returns the design tokens for the active app theme.
 *
 * Theme priority:
 * 1. User-selected theme from Settings
 * 2. Device theme when user selects "system"
 */
export function useColors() {
  const deviceScheme = useColorScheme();
  const { settings } = useSettings();

  const preferredTheme =
    settings.appConfig.themeMode ?? settings.theme ?? "system";
  const resolvedScheme =
    preferredTheme === "system"
      ? deviceScheme === "dark"
        ? "dark"
        : "light"
      : preferredTheme;

  const paletteSource = colors as typeof colors & { dark?: Palette };
  const palette =
    resolvedScheme === "dark" && paletteSource.dark
      ? paletteSource.dark
      : paletteSource.light;

  return {
    ...palette,
    radius: colors.radius,
    colorScheme: resolvedScheme,
    themeMode: preferredTheme,
  };
}
