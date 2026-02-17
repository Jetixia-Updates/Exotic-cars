import { useAuthStore } from "@/store/auth-store";

// فارغ = استخدام عنوان التطبيق الحالي (نفس الدومين). في الإنتاج يمكن تعيين NEXT_PUBLIC_API_URL لسيرفر منفصل.
const getBase = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${getBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.error)
      ? err.error
          .map((e: { message?: string; path?: string[] }) => {
            const m = e.message || JSON.stringify(e);
            const pathStr = e.path?.length ? `${e.path.join(".")}: ` : "";
            return pathStr ? `${pathStr}${m}` : m;
          })
          .join(". ")
      : (err.error ?? err.message ?? res.statusText);
    const message = typeof msg === "string" ? msg : JSON.stringify(msg);
    const ex = new Error(message) as Error & { status?: number };
    ex.status = res.status;
    throw ex;
  }
  return res.json();
}
