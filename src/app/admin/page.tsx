"use client";

import { motion } from "framer-motion";
import { Users, Car, Gavel, Wrench, DollarSign, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { data: stats, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () =>
      api<{
        users: number;
        cars: number;
        auctions: number;
        workshops: number;
        orders: number;
        revenue: number;
      }>("/api/admin/stats"),
    retry: false,
  });

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-white/60">Please sign in as admin.</p>
      </div>
    );
  }

  if (user.role !== "ADMIN") return null;

  const cards = [
    { label: "Users", value: stats?.users ?? 0, icon: Users },
    { label: "Cars", value: stats?.cars ?? 0, icon: Car },
    { label: "Auctions", value: stats?.auctions ?? 0, icon: Gavel },
    { label: "Workshops", value: stats?.workshops ?? 0, icon: Wrench },
    { label: "Orders", value: stats?.orders ?? 0, icon: TrendingUp },
    { label: "Revenue ($)", value: stats?.revenue?.toFixed(0) ?? 0, icon: DollarSign },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Admin Dashboard
        </h1>
        <p className="text-white/60">Overview of platform metrics</p>
      </motion.div>

      {error && (
        <div className="glass-card p-4 mb-6 text-exotic-neon-pink">
          Failed to load stats. Ensure you are logged in as admin.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="glass-card-hover p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">{card.label}</p>
                  <p className="font-display text-3xl font-bold text-exotic-gold mt-1">
                    {card.value}
                  </p>
                </div>
                <card.icon className="h-12 w-12 text-exotic-gold/40" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users">
          <div className="glass-card-hover p-6">
            <h3 className="font-display font-semibold text-exotic-gold-light mb-2">
              Manage Users
            </h3>
            <p className="text-white/60 text-sm">View and moderate users</p>
          </div>
        </Link>
        <Link href="/admin/cars">
          <div className="glass-card-hover p-6">
            <h3 className="font-display font-semibold text-exotic-gold-light mb-2">
              Manage Listings
            </h3>
            <p className="text-white/60 text-sm">Feature cars and moderate</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
