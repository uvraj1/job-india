export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost:8080";
  const protocol =
    process.env.EXPO_PUBLIC_API_PROTOCOL ??
    (domain.includes("localhost") || domain.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${domain}`;
}
