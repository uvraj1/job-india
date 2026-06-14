import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "job" | "system" | "premium";
  fullContent?: string;
  timestamp: number;
}

const STORAGE_KEY = "job_india_notif_v3";

export const usePushNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []); // Run on mount once

  const addNotification = async (notif: Omit<Notification, "read" | "timestamp" | "time">) => {
    const newNotif: Notification = {
      ...notif,
      read: false,
      timestamp: Date.now(),
      time: "Just now"
    };

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];

    // Check for duplicates
    if (existing.some((n: any) => n.id === newNotif.id)) return;

    const updated = [newNotif, ...existing].slice(0, 50); // Keep last 50
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n: any) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter((n: any) => !n.read).length);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const markAllRead = async () => {
    const updated = notifications.map((n: any) => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { notifications, unreadCount, markAsRead, markAllRead, addNotification, refresh: loadData };
};
