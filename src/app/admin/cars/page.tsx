"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminCarsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "cars"],
    queryFn: () =>
      api<{
        cars: {
          id: string;
          title: string;
          brand: string;
          model: string;
          status: string;
          isFeatured: boolean;
          seller: { name: string };
        }[];
      }>("/api/admin/cars"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/admin" className="text-exotic-gold hover:underline mb-6 inline-block">
        ← Back to Admin
      </Link>
      <h1 className="font-display text-3xl font-bold text-exotic-gold-light mb-8">
        Manage Car Listings
      </h1>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-exotic-gold">Car</th>
              <th className="text-left p-4 text-exotic-gold">Seller</th>
              <th className="text-left p-4 text-exotic-gold">Status</th>
              <th className="text-left p-4 text-exotic-gold">Featured</th>
              <th className="text-left p-4 text-exotic-gold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.cars.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="p-4">
                  <Link href={`/cars/${c.id}`} className="text-exotic-gold hover:underline">
                    {c.brand} {c.model}
                  </Link>
                </td>
                <td className="p-4">{c.seller?.name}</td>
                <td className="p-4">{c.status}</td>
                <td className="p-4">{c.isFeatured ? "Yes" : "No"}</td>
                <td className="p-4">
                  <Link href={`/cars/${c.id}`} className="text-exotic-neon hover:underline text-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
