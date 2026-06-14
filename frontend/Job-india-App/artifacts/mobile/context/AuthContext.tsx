import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../utils/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  isPremium?: boolean;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  updateUser: async () => {},
});

const USER_KEY = "job_india_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Setting up listener...");

    if (!auth) {
      console.error("AuthProvider: Auth instance is missing!");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AuthProvider: Auth state changed. User:", firebaseUser?.uid || "None");

      if (firebaseUser) {
        const userData: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || null,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };

        setUser(userData);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      } else {
        setUser(null);
        await AsyncStorage.removeItem(USER_KEY);
      }

      setIsLoading(false);
    }, (error) => {
      console.error("AuthProvider: Listener error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    console.log("AuthProvider: Logging out...");
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Logout error", e);
    }
  }, []);

  const updateUser = useCallback(async (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      void AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
