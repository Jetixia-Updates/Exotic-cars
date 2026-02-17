"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gavel, Clock, Zap, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice, formatDate, getTimeLeft, formatTimeLeft } from "@/lib/utils";

interface Auction {
  id: string;
  currentPrice: number;
  bidCount: number;
  startTime: string;
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

type Tab = "live" | "upcoming" | "ended";

function CountdownBadge({ endTime }: { endTime: string }) {
  const [left, setLeft] = useState<ReturnType<typeof getTimeLeft>>(getTimeLeft(endTime));
  useEffect(() => {
    if (!left) return;
    const t = setInterval(() => setLeft(getTimeLeft(endTime)), 1000);
    return () => clearInterval(t);
  }, [endTime, left]);
  if (!left) return <span className="text-white/60 text-sm">Ended</span>;
  return (
    <span className="text-exotic-neon font-mono font-semibold text-sm">
      {formatTimeLeft(left)}
    </span>
  );
}

export default function AuctionsPage() {
  const [tab, setTab] = useState<Tab>("live");

  const { data: live, isLoading: liveLoading } = useQuery({
    queryKey: ["auctions", "live"],
    queryFn: () => api<Auction[]>("/api/auctions/live"),
  });
  const { data: upcoming } = useQuery({
    queryKey: ["auctions", "upcoming"],
    queryFn: () => api<Auction[]>("/api/auctions/upcoming"),
  });
  const { data: ended } = useQuery({
    queryKey: ["auctions", "ended"],
    queryFn: () => api<Auction[]>("/api/auctions/ended"),
  });

  const tabs = [
    { id: "live" as Tab, label: "Live Now", icon: Zap },
    { id: "upcoming" as Tab, label: "Upcoming", icon: Calendar },
    { id: "ended" as Tab, label: "Ended", icon: CheckCircle },
  ];

  const list =
    tab === "live"
      ? live || []
      : tab === "upcoming"
        ? upcoming || []
        : ended || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 text-exotic-neon mb-2">
          <Gavel className="h-6 w-6" />
          <span className="font-semibold">AUCTIONS</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Live Auctions
        </h1>
        <p className="text-white/60">
          Real-time bidding on premium modified cars. Anti-sniping enabled.
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              tab === t.id
                ? "bg-exotic-gold/20 text-exotic-gold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "live" && liveLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-80 animate-pulse" />
          ))}
        </div>
      )}

      {list.length === 0 && !liveLoading && (
        <div className="glass-card p-12 text-center">
          <Gavel className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">
            {tab === "live" && "No live auctions right now. Check upcoming."}
            {tab === "upcoming" && "No upcoming auctions scheduled."}
            {tab === "ended" && "No ended auctions yet."}
          </p>
          {tab !== "live" && (
            <Button className="mt-4" variant="outline" onClick={() => setTab("live")}>
              View Live
            </Button>
          )}
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((auc, i) => (
            <motion.div
              key={auc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/auctions/${auc.id}`}>
                <div
                  className={`glass-card-hover overflow-hidden h-full ${
                    tab === "live" ? "border-2 border-exotic-neon/30" : ""
                  }`}
                >
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
                    {tab === "live" && (
                      <div className="absolute top-2 left-2 bg-exotic-neon-pink px-2 py-1 rounded text-xs font-bold text-white">
                        LIVE
                      </div>
                    )}
                    {tab === "upcoming" && (
                      <div className="absolute top-2 left-2 bg-exotic-gold/90 text-exotic-black px-2 py-1 rounded text-xs font-bold">
                        UPCOMING
                      </div>
                    )}
                    {tab === "ended" && (
                      <div className="absolute top-2 left-2 bg-white/20 px-2 py-1 rounded text-xs font-medium">
                        ENDED
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                      <span className="text-exotic-gold font-bold text-lg">
                        {formatPrice(auc.currentPrice)}
                      </span>
                      <span className="text-white/80 text-sm flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tab === "live" && <CountdownBadge endTime={auc.endTime} />}
                        {tab === "upcoming" && `Starts ${formatDate(auc.startTime)}`}
                        {tab === "ended" && `Ended ${formatDate(auc.endTime)}`}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-exotic-gold-light">
                      {auc.carListing?.brand} {auc.carListing?.model}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {auc.carListing?.year} • {auc.carListing?.horsepower} HP • {auc.bidCount} bids
                    </p>
                    {tab === "live" && (
                      <Button className="w-full mt-4">
                        <Gavel className="mr-2 h-4 w-4" /> Bid Now
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/auctions/create">
          <Button variant="outline">Create Auction (Sellers)</Button>
        </Link>
      </div>
    </div>
  );
}
