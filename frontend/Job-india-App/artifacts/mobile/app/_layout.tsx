import "@/utils/polyfills";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { UpdateHandler } from "@/components/UpdateHandler";

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Redirect logged-in users away from auth pages
    // Unauthenticated users can browse the main tabs (jobs are fetched via backend API)
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, navigationState?.key]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="career/[code]" />
        <Stack.Screen name="premium/checkout" />
        <Stack.Screen name="premium/resume-analyzer" />
        <Stack.Screen name="premium/salary-insights" />
        <Stack.Screen name="premium/hr-chat" />
        <Stack.Screen name="premium/mock-interview" />
        <Stack.Screen name="premium/cancel-subscription" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
        <Stack.Screen name="companies" options={{ presentation: "modal" }} />
        <Stack.Screen name="company-portal" options={{ presentation: "card" }} />
      </Stack>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A3A5C",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Small delay to ensure the first frame of RootLayoutNav is ready
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 500);
    }
  }, [fontsLoaded, fontError]);

  // Avoid a permanent blank screen while fonts are loading.
  // If fonts hang/fail, we still show a loading UI so the app is usable.
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: "#1A3A5C" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#1A3A5C" }}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <SubscriptionProvider>
              <SettingsProvider>
                <UpdateHandler />
                <RootLayoutNav />
              </SettingsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
