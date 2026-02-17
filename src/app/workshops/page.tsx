"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Workshop {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  services: string[];
  rating: number;
  logo?: string;
  images: string[];
}

export default function WorkshopsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["workshops"],
    queryFn: () => api<{ workshops: Workshop[] }>("/api/workshops?limit=12"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Workshops & Garages
        </h1>
        <p className="text-white/60">
          Elite tuning garages, dyno services & ECU specialists
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.workshops || []).map((ws, i) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/workshops/${ws.id}`}>
                <div className="glass-card-hover p-6 h-full">
                  <div className="flex items-start gap-4">
                    {ws.logo ? (
                      <img
                        src={ws.logo}
                        alt={ws.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-exotic-gold/20 flex items-center justify-center">
                        <Wrench className="h-8 w-8 text-exotic-gold" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-exotic-gold-light">
                        {ws.name}
                      </h3>
                      <p className="flex items-center gap-1 text-exotic-gold text-sm mt-1">
                        <Star className="h-4 w-4 fill-current" />
                        {ws.rating.toFixed(1)}
                      </p>
                      <p className="flex items-center gap-1 text-white/60 text-sm mt-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {ws.city}, {ws.country}
                      </p>
                      <p className="text-white/70 text-sm mt-2 line-clamp-2">
                        {ws.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {ws.services.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 rounded bg-white/10"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
