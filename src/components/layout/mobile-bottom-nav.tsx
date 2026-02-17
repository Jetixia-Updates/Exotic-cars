"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Gavel, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cars", label: "Cars", icon: Car },
  { href: "/auctions", label: "Auctions", icon: Gavel },
  { href: "/parts", label: "Parts", icon: Package },
  { href: "/dashboard", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Don't show on auth pages (login/register) - they have their own flow
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-exotic-black/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isProfile = href === "/dashboard";
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={isProfile && !user ? "/login" : href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors min-w-0",
                isActive
                  ? "text-exotic-gold"
                  : "text-white/60 active:text-exotic-gold"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full px-1">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
