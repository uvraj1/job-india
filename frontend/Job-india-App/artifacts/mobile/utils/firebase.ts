import "./polyfills";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCPcRWIUrghhO-Lvg-biZt55k9L0QZfvsA",
  authDomain: "job-india-application.firebaseapp.com",
  projectId: "job-india-application",
  storageBucket: "job-india-application.firebasestorage.app",
  messagingSenderId: "107029667398",
  appId: "1:107029667398:android:3714ebad682a52711b3447",
  measurementId: "G-E3JME6WP66",
  databaseURL: "https://job-india-application-default-rtdb.firebaseio.com/"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: ReturnType<typeof getAuth>;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const { getReactNativePersistence } = require("firebase/auth");
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_e) {
    auth = getAuth(app);
  }
}

export const db = getDatabase(app);
export { auth };
