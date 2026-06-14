import { Alert, Platform } from "react-native";

export function showAlert(
  title: string,
  message: string,
  buttons?: { text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }[]
) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const destructive = buttons.find((b) => b.style === "destructive");
      const confirmed = destructive
        ? window.confirm(`${title}\n\n${message}`)
        : true;
      if (confirmed) {
        (destructive ?? buttons.find((b) => b.style !== "cancel") ?? buttons[0])?.onPress?.();
      }
      return;
    }
    window.alert(`${title}\n\n${message}`);
    buttons?.[0]?.onPress?.();
    return;
  }
  Alert.alert(title, message, buttons);
}
