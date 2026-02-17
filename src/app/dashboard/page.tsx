"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Gavel, Package, Wrench, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

const links = [
  { href: "/dashboard/garage", icon: Car, label: "My Garage" },
  { href: "/dashboard/listings", icon: Car, label: "My Listings" },
  { href: "/dashboard/bids", icon: Gavel, label: "My Bids" },
  { href: "/dashboard/bookings", icon: Wrench, label: "Bookings" },
  { href: "/dashboard/cart", icon: Package, label: "Cart" },
  { href: "/dashboard/messages", icon: Calendar, label: "Messages" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-white/60 mb-4">Please sign in to access your dashboard.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Dashboard
        </h1>
        <p className="text-white/60">
          Welcome back, {user.name}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={link.href}>
              <div className="glass-card-hover p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-exotic-gold/20 flex items-center justify-center">
                  <link.icon className="h-6 w-6 text-exotic-gold" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-exotic-gold-light">
                    {link.label}
                  </h3>
                  <p className="text-white/60 text-sm">View and manage</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
