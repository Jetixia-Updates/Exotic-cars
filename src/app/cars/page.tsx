"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface CarListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number | null;
  horsepower: number;
  modificationLevel: string;
  images: string[];
  listingType: string;
}

export default function CarsPage() {
  const [brand, setBrand] = useState("");
  const [minHp, setMinHp] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["cars", brand, minHp, maxPrice, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (brand) params.set("brand", brand);
      if (minHp) params.set("minHp", minHp);
      if (maxPrice) params.set("maxPrice", maxPrice);
      return api<{ cars: CarListing[]; total: number }>(`/api/cars?${params}`);
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Explore Cars
        </h1>
        <p className="text-white/60">
          Discover premium modified cars from around the world
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="glass-card p-4 space-y-4 sticky top-24">
            <h3 className="font-semibold text-exotic-gold">Filters</h3>
            <div>
              <label className="text-sm text-white/60">Brand</label>
              <Input
                placeholder="e.g. Lamborghini"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-white/60">Min HP</label>
              <Input
                type="number"
                placeholder="0"
                value={minHp}
                onChange={(e) => setMinHp(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-white/60">Max Price ($)</label>
              <Input
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={() => setPage(1)}>
              <Search className="mr-2 h-4 w-4" /> Apply
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.cars.map((car, i) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/cars/${car.id}`}>
                    <div className="glass-card-hover overflow-hidden group h-full">
                      <div className="aspect-video bg-exotic-smoke relative">
                        {car.images?.[0] ? (
                          <img
                            src={car.images[0]}
                            alt={car.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-20 w-20 text-white/20" />
                          </div>
                        )}
                        {car.listingType === "AUCTION" && (
                          <span className="absolute top-2 right-2 bg-exotic-neon-pink text-xs font-bold px-2 py-1 rounded">
                            AUCTION
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-exotic-gold-light">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-white/60 text-sm">{car.year} • {car.horsepower} HP</p>
                        <p className="text-exotic-gold font-semibold mt-2">
                          {car.price != null ? formatPrice(car.price) : "Auction"}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {data && data.total > 12 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page * 12 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
