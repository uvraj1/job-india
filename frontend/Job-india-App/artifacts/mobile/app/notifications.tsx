import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePushNotifications, Notification } from "@/hooks/usePushNotifications";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markAsRead, markAllRead } = usePushNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const openNotification = (item: Notification) => {
    markAsRead(item.id);
    setSelectedNotification(item);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read ? "transparent" : colors.primary + "10",
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => openNotification(item)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconBgColor(item.type) },
        ]}
      >
        <Feather
          name={getIconName(item.type)}
          size={20}
          color={getIconColor(item.type)}
        />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                fontWeight: item.read ? "600" : "800",
              },
            ]}
          >
            {item.title}
          </Text>
          {!item.read && (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.primary }]}
            />
          )}
        </View>
        <Text
          style={[styles.body, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAllText}>Read All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No notifications yet
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.detailHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.iconLarge,
                  {
                    backgroundColor: getIconBgColor(
                      selectedNotification?.type || "system",
                    ),
                  },
                ]}
              >
                <Feather
                  name={getIconName(selectedNotification?.type || "system")}
                  size={24}
                  color={getIconColor(
                    selectedNotification?.type || "system",
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailType, { color: colors.primary }]}>
                  {(selectedNotification?.type || "notification").toUpperCase()}
                </Text>
                <Text
                  style={[styles.detailTime, { color: colors.mutedForeground }]}
                >
                  {selectedNotification?.time}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedNotification(null)}
                style={styles.closeBtn}
              >
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailScroll}>
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                {selectedNotification?.title}
              </Text>
              <Text
                style={[styles.detailContent, { color: colors.foreground }]}
              >
                {selectedNotification?.fullContent ||
                  selectedNotification?.body}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.doneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getIconName(type: Notification["type"]) {
  switch (type) {
    case "job":
      return "briefcase";
    case "premium":
      return "award";
    default:
      return "bell";
  }
}

function getIconBgColor(type: Notification["type"]) {
  switch (type) {
    case "job":
      return "#E0F2FE";
    case "premium":
      return "#FEF3C7";
    default:
      return "#F3F4F6";
  }
}

function getIconColor(type: Notification["type"]) {
  switch (type) {
    case "job":
      return "#0284C7";
    case "premium":
      return "#D97706";
    default:
      return "#4B5563";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  backBtn: { padding: 4 },
  readAllText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  notificationItem: { flexDirection: "row", padding: 16, borderBottomWidth: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 16, flex: 1, marginRight: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  time: { fontSize: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: { fontSize: 16, marginTop: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailCard: {
    height: "70%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  iconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  detailType: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  detailTime: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 8 },
  detailScroll: { gap: 16 },
  detailTitle: { fontSize: 22, fontWeight: "800", lineHeight: 30 },
  detailContent: { fontSize: 15, lineHeight: 26, opacity: 0.8 },
  doneBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
