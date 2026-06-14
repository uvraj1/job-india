import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="account" />
      <Stack.Screen name="job-preferences" />
      <Stack.Screen name="company-register" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="app-settings" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
