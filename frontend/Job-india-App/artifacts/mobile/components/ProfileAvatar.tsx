import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle, ImageStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProfileAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function ProfileAvatar({
  name,
  photoUrl,
  size = 48,
  backgroundColor,
  textColor,
  style,
}: ProfileAvatarProps) {
  const colors = useColors();
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: backgroundColor || colors.muted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={containerStyle}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={imageStyle}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.4, color: textColor || colors.mutedForeground },
          ]}
        >
          {initials || <Feather name="user" size={size * 0.5} />}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    fontWeight: "700",
  },
});
