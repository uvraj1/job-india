import { getApiBaseUrl } from "./apiConfig";

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Failed to change password" };
  }
  return { ok: true };
}

export async function deleteAccount(
  token: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Failed to delete account" };
  }
  return { ok: true };
}
