"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";

export default function AdminUsersPage() {
  const { data } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<{ users: { id: string; email: string; name: string; role: string; isActive: boolean }[] }>("/api/admin/users"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/admin" className="text-exotic-gold hover:underline mb-6 inline-block">
        ← Back to Admin
      </Link>
      <h1 className="font-display text-3xl font-bold text-exotic-gold-light mb-8">
        Manage Users
      </h1>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-exotic-gold">Name</th>
              <th className="text-left p-4 text-exotic-gold">Email</th>
              <th className="text-left p-4 text-exotic-gold">Role</th>
              <th className="text-left p-4 text-exotic-gold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-4">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4">{u.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
