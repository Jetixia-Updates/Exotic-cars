"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);

  const { data: part, isLoading } = useQuery({
    queryKey: ["part", id],
    queryFn: () =>
      api<{
        id: string;
        title: string;
        description: string;
        category: string;
        condition: string;
        price: number;
        images: string[];
        brand?: string;
        compatibility?: unknown;
        seller: { id: string; name: string };
      }>(`/api/parts/${id}`),
  });

  if (isLoading || !part) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/parts" className="inline-flex items-center text-exotic-gold hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to parts
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-12"
      >
        <div className="aspect-square rounded-xl overflow-hidden bg-exotic-smoke">
          {part.images?.[0] ? (
            <img
              src={part.images[0]}
              alt={part.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-32 w-32 text-white/20" />
            </div>
          )}
        </div>

        <div>
          <p className="text-exotic-gold/80 text-sm uppercase mb-2">
            {part.category.replace(/_/g, " ")} • {part.condition}
          </p>
          <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-4">
            {part.title}
          </h1>
          <p className="text-3xl font-bold text-exotic-gold mb-6">
            {formatPrice(part.price)}
          </p>
          <p className="text-white/70 mb-6">{part.description}</p>
          {user && (
            <Button>Add to Cart</Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
