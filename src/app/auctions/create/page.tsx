"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gavel, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function CreateAuctionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [carListingId, setCarListingId] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extendMinutes, setExtendMinutes] = useState("5");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: myCarsData } = useQuery({
    queryKey: ["my-cars", user?.id],
    queryFn: () => api<{ cars: { id: string; title: string; brand: string; model: string; year: number; listingType: string }[] }>("/api/cars/my"),
    enabled: !!user,
  });

  const myListings = (myCarsData?.cars ?? []).filter(
    (c) => c.listingType === "FIXED_PRICE" || c.listingType === "AUCTION"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }
    if (!carListingId || !startPrice || !startTime || !endTime) {
      setError("Fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ id: string }>("/api/auctions", {
        method: "POST",
        body: JSON.stringify({
          carListingId,
          startPrice: Number(startPrice),
          reservePrice: reservePrice ? Number(reservePrice) : undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          extendMinutes: Number(extendMinutes) || 5,
        }),
      });
      router.push(`/auctions/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create auction");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-white/60 mb-4">Sign in to create an auction.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link href="/auctions" className="inline-flex items-center text-exotic-gold hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to auctions
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h1 className="font-display text-3xl font-bold text-exotic-gold-light mb-2 flex items-center gap-2">
          <Gavel className="h-8 w-8" /> Create Auction
        </h1>
        <p className="text-white/60 mb-6">List one of your cars for live bidding.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-exotic-neon-pink/20 text-exotic-neon-pink text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Select car *</label>
            <select
              value={carListingId}
              onChange={(e) => setCarListingId(e.target.value)}
              required
              className="flex h-10 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-exotic-gold-light"
            >
              <option value="">Choose a listing</option>
              {myListings.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model} ({c.year})
                </option>
              ))}
            </select>
            {myListings.length === 0 && (
              <p className="text-white/50 text-sm mt-1">You have no car listings. List a car first from Dashboard.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Start price ($) *</label>
              <Input
                type="number"
                min={1}
                step={1000}
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder="e.g. 50000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Reserve price ($)</label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Start time *</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">End time *</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Extend on late bid (minutes)</label>
            <Input
              type="number"
              min={1}
              max={15}
              value={extendMinutes}
              onChange={(e) => setExtendMinutes(e.target.value)}
              placeholder="5"
            />
            <p className="text-white/50 text-xs mt-1">If someone bids in the last N minutes, end time extends by N minutes (anti-sniping).</p>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || myListings.length === 0}>
            {submitting ? "Creating..." : "Create Auction"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
