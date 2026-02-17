import { useAuthStore } from "@/store/auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || res.statusText);
  }
  return res.json();
}
