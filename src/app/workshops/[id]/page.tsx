"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, MapPin, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: workshop, isLoading } = useQuery({
    queryKey: ["workshop", id],
    queryFn: () =>
      api<{
        id: string;
        name: string;
        description: string;
        address: string;
        city: string;
        country: string;
        phone?: string;
        email: string;
        website?: string;
        services: string[];
        rating: number;
        logo?: string;
        images: string[];
      }>(`/api/workshops/${id}`),
  });

  if (isLoading || !workshop) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/workshops" className="inline-flex items-center text-exotic-gold hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to workshops
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-8 mb-8">
          {workshop.logo ? (
            <img
              src={workshop.logo}
              alt={workshop.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-exotic-gold/20 flex items-center justify-center">
              <Wrench className="h-12 w-12 text-exotic-gold" />
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
              {workshop.name}
            </h1>
            <p className="flex items-center gap-1 text-exotic-gold mb-2">
              <Star className="h-5 w-5 fill-current" />
              {workshop.rating.toFixed(1)}
            </p>
            <p className="flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4 shrink-0" />
              {workshop.address}, {workshop.city}, {workshop.country}
            </p>
          </div>
        </div>

        <div className="glass-card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-exotic-gold mb-4">
            About
          </h2>
          <p className="text-white/70">{workshop.description}</p>
        </div>

        <div className="glass-card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-exotic-gold mb-4">
            Services
          </h2>
          <div className="flex flex-wrap gap-2">
            {workshop.services.map((s) => (
              <span
                key={s}
                className="px-4 py-2 rounded-lg bg-exotic-gold/20 text-exotic-gold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <Link href={`/bookings?workshop=${workshop.id}`}>
          <Button size="lg">Book a Service</Button>
        </Link>
      </motion.div>
    </div>
  );
}
