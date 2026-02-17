"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gavel, Clock, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice, formatDate, getTimeLeft, formatTimeLeft } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAuctionSocket } from "@/hooks/use-auction-socket";

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState("");
  const user = useAuthStore((s) => s.user);

  const { auction: wsAuction, connected } = useAuctionSocket(id);

  const { data: initialAuction, refetch } = useQuery({
    queryKey: ["auction", id],
    queryFn: () =>
      api<{
        id: string;
        currentPrice: number;
        currentBidderId: string | null;
        bidCount: number;
        startTime: string;
        endTime: string;
        status: string;
        reservePrice: number | null;
        extendMinutes: number;
        carListing: {
          id: string;
          title: string;
          brand: string;
          model: string;
          year: number;
          images: string[];
          horsepower: number;
          description?: string;
        };
        bids: { id: string; amount: number; createdAt: string; user?: { id: string; name: string } }[];
      }>(`/api/auctions/${id}`),
  });

  const auction = (wsAuction
    ? {
        ...initialAuction,
        ...wsAuction,
        carListing: wsAuction.carListing || initialAuction?.carListing,
        bids: wsAuction.bids ?? initialAuction?.bids,
        reservePrice: initialAuction?.reservePrice ?? (wsAuction as { reservePrice?: number })?.reservePrice,
        extendMinutes: initialAuction?.extendMinutes ?? (wsAuction as { extendMinutes?: number })?.extendMinutes,
      }
    : initialAuction) as typeof initialAuction;

  const { data: minBidData } = useQuery({
    queryKey: ["auction", "min-bid", id, auction?.currentPrice],
    queryFn: () => api<{ minBid: number; currentPrice: number }>(`/api/auctions/min-bid/${id}`),
    enabled: !!id && !!auction && auction.status === "LIVE",
  });

  const minBid = minBidData?.minBid ?? (auction ? auction.currentPrice + 500 : 0);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    if (!auction?.endTime) return;
    const update = () => setTimeLeft(getTimeLeft(auction.endTime));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [auction?.endTime]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError("");
    const amount = Number(bidAmount);
    if (!amount || amount < minBid) {
      setBidError(`Minimum bid is ${formatPrice(minBid)}`);
      return;
    }
    setBidding(true);
    try {
      await api<{ auction: unknown }>(`/api/auctions/${id}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setBidAmount("");
      refetch();
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Bid failed");
    } finally {
      setBidding(false);
    }
  };

  const isHighestBidder = user && auction?.currentBidderId === user.id;
  const isLive = auction?.status === "LIVE";
  const hasEnded = timeLeft === null && auction?.endTime && new Date(auction.endTime) < new Date();

  if (!auction && !initialAuction) {
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
            {auction?.carListing?.images?.[0] ? (
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
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded font-bold text-sm ${
                  isLive ? "bg-exotic-neon-pink text-white" : hasEnded ? "bg-white/20" : "bg-exotic-gold/90 text-exotic-black"
                }`}
              >
                {isLive ? "LIVE" : hasEnded ? "ENDED" : auction?.status}
              </span>
              {connected ? (
                <span className="flex items-center gap-1 text-exotic-neon text-xs">
                  <Wifi className="h-4 w-4" /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-white/50 text-xs">
                  <WifiOff className="h-4 w-4" /> Connecting...
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
            {auction?.carListing?.brand} {auction?.carListing?.model}
          </h1>
          <p className="text-white/60 text-lg mb-6">{auction?.carListing?.year}</p>

          <div className="glass-card p-6 mb-6">
            <p className="text-white/60 text-sm mb-1">Current Bid</p>
            <p className="text-3xl font-bold text-exotic-gold">
              {formatPrice(auction?.currentPrice ?? 0)}
            </p>
            {isLive && timeLeft && (
              <p className="text-exotic-neon font-mono font-semibold mt-2">
                {formatTimeLeft(timeLeft)} left
              </p>
            )}
            {hasEnded && (
              <p className="text-white/60 text-sm mt-2">Ended {formatDate(auction?.endTime ?? "")}</p>
            )}
            <p className="text-white/60 text-sm mt-1">
              {auction?.bidCount ?? 0} bids
              {auction?.reservePrice != null && ` • Reserve: ${formatPrice(auction.reservePrice)}`}
            </p>
            {isHighestBidder && isLive && (
              <p className="mt-3 text-exotic-neon font-medium">You are the highest bidder</p>
            )}
          </div>

          {user && isLive && !hasEnded && (
            <form onSubmit={handleBid} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Your bid (min {formatPrice(minBid)})</label>
                <Input
                  type="number"
                  placeholder={formatPrice(minBid)}
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value);
                    setBidError("");
                  }}
                  min={minBid}
                  step={100}
                />
              </div>
              {bidError && <p className="text-exotic-neon-pink text-sm">{bidError}</p>}
              <Button type="submit" className="w-full" disabled={bidding}>
                <Gavel className="mr-2 h-4 w-4" /> {bidding ? "Placing bid..." : "Place Bid"}
              </Button>
              <p className="text-white/50 text-xs">
                Bids in the last {auction?.extendMinutes ?? 5} minutes extend the auction.
              </p>
            </form>
          )}

          {!user && isLive && !hasEnded && (
            <Link href="/login">
              <Button className="w-full">Sign in to Bid</Button>
            </Link>
          )}

          {auction?.bids && auction.bids.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-exotic-gold mb-4">Bid History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {auction.bids.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-white/70">
                      {formatPrice(b.amount)}
                      {b.user && ` • ${b.user.name}`}
                      {b.user?.id === user?.id && " (you)"}
                    </span>
                    <span className="text-white/50 text-sm">{formatDate(b.createdAt)}</span>
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
