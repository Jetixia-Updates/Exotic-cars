"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Car, Gavel, Wrench, Package, Users, Calendar, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cars", label: "Explore Cars", icon: Car },
  { href: "/auctions", label: "Auctions Live", icon: Gavel },
  { href: "/parts", label: "Parts", icon: Package },
  { href: "/workshops", label: "Workshops", icon: Wrench },
  { href: "/builder", label: "Upgrade Builder", icon: Zap },
  { href: "/community", label: "Community", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-exotic-black/80 backdrop-blur-xl"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-gradient-gold">
            EXOTIC CARS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.slice(1).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-white/80 hover:text-exotic-gold",
                  pathname.startsWith(href) && "text-exotic-gold"
                )}
              >
                {Icon && <Icon className="mr-1.5 h-4 w-4" />}
                {label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <User className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={clearAuth}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
