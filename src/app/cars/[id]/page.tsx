"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, MapPin, Gavel, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: () =>
      api<{
        id: string;
        title: string;
        description: string;
        brand: string;
        model: string;
        year: number;
        price: number | null;
        horsepower: number;
        modificationLevel: string;
        engine?: string;
        images: string[];
        listingType: string;
        location?: string;
        seller: { id: string; name: string; avatar?: string };
        auction?: { id: string; currentPrice: number; endTime: string; status: string };
      }>(`/api/cars/${id}`),
  });

  if (isLoading || !car) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/cars" className="inline-flex items-center text-exotic-gold hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to listings
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-12"
      >
        <div className="space-y-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-exotic-smoke relative">
            {car.images?.[0] ? (
              <img
                src={car.images[0]}
                alt={car.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="h-32 w-32 text-white/20" />
              </div>
            )}
            {car.listingType === "AUCTION" && car.auction && (
              <div className="absolute bottom-4 left-4 right-4 glass-card p-4">
                <div className="flex justify-between items-center">
                  <span className="text-exotic-gold font-semibold">
                    Current: {formatPrice(car.auction.currentPrice)}
                  </span>
                  <Link href={car.auction ? `/auctions/${car.auction.id}` : "#"}>
                    <Button size="sm" className="gap-1">
                      <Gavel className="h-4 w-4" /> Bid Now
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          {car.images && car.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {car.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden bg-exotic-smoke">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
            {car.brand} {car.model}
          </h1>
          <p className="text-white/60 text-lg mb-4">{car.year}</p>
          <div className="flex flex-wrap gap-4 mb-6">
            <span className="px-3 py-1 rounded-full bg-exotic-gold/20 text-exotic-gold text-sm">
              {car.modificationLevel}
            </span>
            <span className="px-3 py-1 rounded-full bg-exotic-neon/20 text-exotic-neon text-sm">
              {car.horsepower} HP
            </span>
            {car.engine && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                {car.engine}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-exotic-gold mb-6">
            {car.price != null ? formatPrice(car.price) : car.auction ? formatPrice(car.auction.currentPrice) : "Contact for price"}
          </p>
          <p className="text-white/70 mb-6">{car.description}</p>
          {car.location && (
            <p className="flex items-center gap-2 text-white/60 mb-6">
              <MapPin className="h-4 w-4" /> {car.location}
            </p>
          )}
          <div className="flex items-center gap-4">
            <Link href={`/users/${car.seller.id}`}>
              <Button variant="outline">View Seller</Button>
            </Link>
            {car.listingType === "FIXED_PRICE" && (
              <Button>Contact Seller</Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
