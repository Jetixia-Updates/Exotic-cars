"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gavel, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

interface Auction {
  id: string;
  currentPrice: number;
  bidCount: number;
  endTime: string;
  status: string;
  carListing: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    images: string[];
    horsepower: number;
  };
}

export default function AuctionsPage() {
  const { data: live } = useQuery({
    queryKey: ["auctions", "live"],
    queryFn: () => api<Auction[]>("/api/auctions/live"),
  });
  const { data: all } = useQuery({
    queryKey: ["auctions"],
    queryFn: () => api<{ auctions: Auction[] }>("/api/auctions?limit=12"),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 text-exotic-neon mb-2">
          <Zap className="h-6 w-6" />
          <span className="font-semibold">LIVE NOW</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Live Auctions
        </h1>
        <p className="text-white/60">
          Real-time bidding on premium modified cars
        </p>
      </motion.div>

      {live && live.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-semibold text-exotic-gold mb-6">
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {live.map((auc, i) => (
              <motion.div
                key={auc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/auctions/${auc.id}`}>
                  <div className="glass-card-hover overflow-hidden border-2 border-exotic-neon/30">
                    <div className="aspect-video bg-exotic-smoke relative">
                      {auc.carListing?.images?.[0] ? (
                        <img
                          src={auc.carListing.images[0]}
                          alt={auc.carListing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gavel className="h-20 w-20 text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-exotic-neon-pink px-2 py-1 rounded text-xs font-bold text-white">
                        LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <span className="text-exotic-gold font-bold text-lg">
                          {formatPrice(auc.currentPrice)}
                        </span>
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(auc.endTime)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-exotic-gold-light">
                        {auc.carListing.brand} {auc.carListing.model}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {auc.carListing.year} • {auc.carListing.horsepower} HP • {auc.bidCount} bids
                      </p>
                      <Button className="w-full mt-4">
                        <Gavel className="mr-2 h-4 w-4" /> Bid Now
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold text-exotic-gold mb-6">
          All Auctions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(all?.auctions || []).map((auc, i) => (
            <motion.div
              key={auc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/auctions/${auc.id}`}>
                <div className="glass-card-hover overflow-hidden">
                  <div className="aspect-video bg-exotic-smoke relative">
                    {auc.carListing?.images?.[0] ? (
                      <img
                        src={auc.carListing.images[0]}
                        alt={auc.carListing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-20 w-20 text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-exotic-gold font-bold">
                        {formatPrice(auc.currentPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-exotic-gold-light">
                      {auc.carListing?.brand} {auc.carListing?.model}
                    </h3>
                    <p className="text-white/60 text-sm">{auc.carListing?.year}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
