import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { checkSubscriptionStatus } from "@/utils/paymentService";
import { useAuth } from "./AuthContext";

const SUB_KEY = "job_india_subscription";

interface Subscription {
  isActive: boolean;
  planType?: "monthly" | "yearly";
  expiryDate?: string;
  activatedAt?: string;
  transactionId?: string;
}

interface SubscriptionContextType {
  subscription: Subscription;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  updateSubscription: (
    plan: "monthly" | "yearly",
    transactionId?: string
  ) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    isActive: false,
  });
  const [loading, setLoading] = useState(true);

  const loadFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(SUB_KEY);
      if (raw) {
        const record: Subscription = JSON.parse(raw);
        if (record.isActive && record.expiryDate) {
          if (new Date(record.expiryDate) >= new Date()) {
            setSubscription(record);
            setLoading(false);
            return;
          }
          await AsyncStorage.removeItem(SUB_KEY);
        }
      }
    } catch {}
    setSubscription({ isActive: false });
    setLoading(false);
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      loadFromStorage();
      return;
    }

    // 🚀 SPECIAL TESTING LOGIC
    if (user.email === "testing2@jobindia.com") {
      setSubscription({
        isActive: true,
        planType: "yearly",
        expiryDate: "2099-12-31T23:59:59Z",
        activatedAt: new Date().toISOString(),
        transactionId: "TEST_PREMIUM_ACCOUNT"
      });
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        setLoading(true);
        const status = await checkSubscriptionStatus(user.id);
        setSubscription(status);
      } catch {
        setSubscription({ isActive: false });
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user?.id]);

  const refreshSubscription = async () => {
    await loadFromStorage();
  };

  const updateSubscription = async (
    plan: "monthly" | "yearly",
    transactionId?: string
  ) => {
    const expiryDate = new Date();
    if (plan === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    const record: Subscription = {
      isActive: true,
      planType: plan,
      expiryDate: expiryDate.toISOString(),
      activatedAt: new Date().toISOString(),
      transactionId: transactionId || subscription.transactionId,
    };
    setSubscription(record);
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(record));
  };

  const cancelSubscription = async () => {
    const { cancelSubscription: apiCancel } = await import("@/utils/paymentService");
    await apiCancel(user?.id);
    setSubscription({ isActive: false });
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription,
        updateSubscription,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
};
