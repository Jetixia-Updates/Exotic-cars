import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002");
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "";

export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/** Returns { days, hours, minutes, seconds } until end, or null if ended */
export function getTimeLeft(endTime: string | Date): { days: number; hours: number; minutes: number; seconds: number } | null {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  if (end <= now) return null;
  const diff = end - now;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, minutes, seconds };
}

export function formatTimeLeft(t: { days: number; hours: number; minutes: number; seconds: number }): string {
  const parts = [];
  if (t.days > 0) parts.push(`${t.days}d`);
  parts.push(String(t.hours).padStart(2, "0"));
  parts.push(String(t.minutes).padStart(2, "0"));
  parts.push(String(t.seconds).padStart(2, "0"));
  return parts.join(" : ");
}
