"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gavel, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bidAmount, setBidAmount] = useState("");
  const user = useAuthStore((s) => s.user);

  const { data: auction, refetch } = useQuery({
    queryKey: ["auction", id],
    queryFn: () =>
      api<{
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
        bids: { amount: number; createdAt: string; user?: { name: string } }[];
      }>(`/api/auctions/${id}`),
  });

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(bidAmount);
    if (!amount || amount <= (auction?.currentPrice ?? 0)) return;
    try {
      await api(`/api/auctions/${id}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setBidAmount("");
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bid failed");
    }
  };

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/auctions" className="inline-flex items-center text-exotic-gold hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to auctions
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-12"
      >
        <div>
          <div className="aspect-video rounded-xl overflow-hidden bg-exotic-smoke relative">
            {auction.carListing?.images?.[0] ? (
              <img
                src={auction.carListing.images[0]}
                alt={auction.carListing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gavel className="h-32 w-32 text-white/20" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-exotic-neon-pink px-3 py-1 rounded font-bold text-sm">
              {auction.status === "LIVE" ? "LIVE" : auction.status}
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
            {auction.carListing?.brand} {auction.carListing?.model}
          </h1>
          <p className="text-white/60 text-lg mb-6">{auction.carListing?.year}</p>

          <div className="glass-card p-6 mb-6">
            <p className="text-white/60 text-sm mb-1">Current Bid</p>
            <p className="text-3xl font-bold text-exotic-gold">
              {formatPrice(auction.currentPrice)}
            </p>
            <p className="text-white/60 text-sm mt-2 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Ends {formatDate(auction.endTime)} • {auction.bidCount} bids
            </p>
          </div>

          {user && auction.status === "LIVE" && (
            <form onSubmit={handleBid} className="space-y-4">
              <Input
                type="number"
                placeholder={`Min ${formatPrice(auction.currentPrice + 1000)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={auction.currentPrice + 1000}
                step={1000}
              />
              <Button type="submit" className="w-full">
                <Gavel className="mr-2 h-4 w-4" /> Place Bid
              </Button>
            </form>
          )}

          {!user && (
            <Link href="/login">
              <Button className="w-full">Sign in to Bid</Button>
            </Link>
          )}

          {auction.bids && auction.bids.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-exotic-gold mb-4">Bid History</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auction.bids.map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-white/70">
                      {formatPrice(b.amount)}
                      {b.user && ` by ${b.user.name}`}
                    </span>
                    <span className="text-white/50 text-sm">
                      {formatDate(b.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
