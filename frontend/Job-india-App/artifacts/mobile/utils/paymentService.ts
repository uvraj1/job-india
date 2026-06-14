import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, set, get, remove } from "firebase/database";
import { db } from "./firebase";

const SUB_KEY = "job_india_subscription";

export interface PaymentOrder {
  amount: number;
  planId: "monthly" | "yearly";
  planTitle: string;
  upiId?: string;
  paymentMethod?: "upi" | "card" | "netbanking";
  userId?: string;
}

export interface PaymentResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  error?: string;
}

export interface SubscriptionRecord {
  isActive: boolean;
  planType?: "monthly" | "yearly";
  expiryDate?: string;
  activatedAt?: string;
  transactionId?: string;
}

export const checkSubscriptionStatus = async (
  userId: string
): Promise<SubscriptionRecord> => {
  try {
    // 🚀 STRICT MODE: Only trust Firebase Database (Source of Truth)
    if (!userId) return { isActive: false };

    const subRef = ref(db, `subscriptions/${userId}`);
    const snapshot = await get(subRef);

    if (snapshot.exists()) {
      const record: SubscriptionRecord = snapshot.val();

      // Verification logic
      if (record.isActive && record.expiryDate) {
        if (new Date(record.expiryDate) >= new Date()) {
          // Sync local cache for UI speed, but data came from server
          await AsyncStorage.setItem(SUB_KEY, JSON.stringify(record));
          return record;
        } else {
          // Subscription Expired - Clean up
          await remove(subRef);
          await AsyncStorage.removeItem(SUB_KEY);
          return { isActive: false };
        }
      }
    }

    // If not found in Firebase, strictly return inactive
    await AsyncStorage.removeItem(SUB_KEY);
    return { isActive: false };
  } catch (error) {
    console.error("Critical Security Error during sub check:", error);
    return { isActive: false };
  }
};

export const processPayment = async (
  orderData: PaymentOrder
): Promise<PaymentResponse> => {
  // 🚀 TESTING LOGIC: Simulate failure for specific UPI ID
  if (orderData.upiId === "fail@upi") {
    await new Promise((r) => setTimeout(r, 1500));
    return { success: false, error: "Payment declined by bank." };
  }

  await new Promise((r) => setTimeout(r, 2000));
  const txnId = "TXN" + Date.now().toString().slice(-8).toUpperCase();
  const expiryDate = new Date();
  if (orderData.planId === "monthly") {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }

  const record: SubscriptionRecord = {
    isActive: true,
    planType: orderData.planId,
    expiryDate: expiryDate.toISOString(),
    activatedAt: new Date().toISOString(),
    transactionId: txnId,
  };

  // 3. Save to Firebase and Local Storage
  if (orderData.userId) {
    try {
      const subRef = ref(db, `subscriptions/${orderData.userId}`);
      await set(subRef, record);
    } catch (e) {
      console.error("Firebase subscription sync failed", e);
    }
  }

  await AsyncStorage.setItem(SUB_KEY, JSON.stringify(record));

  return { success: true, transactionId: txnId, orderId: "ORD" + Date.now() };
};

export const cancelSubscription = async (userId?: string): Promise<void> => {
  await AsyncStorage.removeItem(SUB_KEY);
  if (userId) {
    try {
      await remove(ref(db, `subscriptions/${userId}`));
    } catch {}
  }
};
