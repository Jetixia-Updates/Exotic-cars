"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  country: string;
  startTime: string;
  endTime: string;
  coverImage?: string;
  status: string;
}

export default function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api<{ events: Event[] }>("/api/events?limit=12"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Meetups & Events
        </h1>
        <p className="text-white/60">
          Car meets and gatherings near you
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.events || []).map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card-hover overflow-hidden h-full">
                <div className="aspect-video bg-exotic-smoke relative">
                  {ev.coverImage ? (
                    <img
                      src={ev.coverImage}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-20 w-20 text-white/20" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                      ev.status === "PUBLISHED"
                        ? "bg-exotic-neon/20 text-exotic-neon"
                        : "bg-white/20"
                    }`}
                  >
                    {ev.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-exotic-gold-light">
                    {ev.title}
                  </h3>
                  <p className="flex items-center gap-1 text-white/60 text-sm mt-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {ev.city}, {ev.country}
                  </p>
                  <p className="text-exotic-gold text-sm mt-2">
                    {formatDate(ev.startTime)}
                  </p>
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">
                    {ev.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
