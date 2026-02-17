"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const CATEGORIES = [
  "ENGINES",
  "TURBO_KITS",
  "EXHAUST_SYSTEMS",
  "BODY_KITS",
  "WHEELS_TIRES",
  "ELECTRONICS_ECU",
];

interface Part {
  id: string;
  title: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
  brand?: string;
}

export default function PartsPage() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["parts", category, search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      return api<{ parts: Part[]; total: number }>(`/api/parts?${params}`);
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Spare Parts Marketplace
        </h1>
        <p className="text-white/60">
          Engines, turbos, body kits, wheels & more
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="glass-card p-4 space-y-4 sticky top-24">
            <h3 className="font-semibold text-exotic-gold">Categories</h3>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  category === cat
                    ? "bg-exotic-gold/20 text-exotic-gold"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {cat.replace(/_/g, " ")}
              </button>
            ))}
            <div className="pt-4">
              <label className="text-sm text-white/60">Search</label>
              <Input
                placeholder="Search parts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={() => setPage(1)}>
              <Search className="mr-2 h-4 w-4" /> Apply
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.parts.map((part, i) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/parts/${part.id}`}>
                    <div className="glass-card-hover overflow-hidden group h-full">
                      <div className="aspect-square bg-exotic-smoke relative">
                        {part.images?.[0] ? (
                          <img
                            src={part.images[0]}
                            alt={part.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-20 w-20 text-white/20" />
                          </div>
                        )}
                        <span className="absolute top-2 right-2 bg-exotic-carbon/80 px-2 py-1 rounded text-xs">
                          {part.condition}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-exotic-gold/80 text-xs uppercase">
                          {part.category.replace(/_/g, " ")}
                        </p>
                        <h3 className="font-display font-semibold text-exotic-gold-light mt-1">
                          {part.title}
                        </h3>
                        <p className="text-exotic-gold font-semibold mt-2">
                          {formatPrice(part.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
