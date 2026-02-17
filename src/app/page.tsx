"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Gavel, Package, Wrench, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["cars", "featured"],
    queryFn: () => api<{ id: string; title: string; brand: string; model: string; year: number; price: number | null; images: string[] }[]>("/api/cars/featured"),
    retry: false,
  });

  const features = [
    { icon: Car, title: "Exotic Marketplace", desc: "Premium modified cars from around the globe", href: "/cars" },
    { icon: Gavel, title: "Live Auctions", desc: "Real-time bidding with anti-sniping", href: "/auctions" },
    { icon: Package, title: "Spare Parts", desc: "Engines, turbos, body kits & more", href: "/parts" },
    { icon: Wrench, title: "Workshops", desc: "Elite tuning garages & bookings", href: "/workshops" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1920)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-exotic" />
        <div className="absolute inset-0 bg-exotic-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-exotic-black via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-exotic-gold font-semibold tracking-widest uppercase mb-4">
              Elite Automotive Platform
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-exotic-gold-light mb-6">
              Where Power
              <br />
              <span className="text-gradient-gold">Meets Precision</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Discover, bid, and own the world&apos;s most coveted modified cars.
              Join the global community of elite automotive enthusiasts.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cars">
                <Button size="lg" className="gap-2">
                  Explore Cars <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auctions">
                <Button variant="outline" size="lg" className="gap-2">
                  <Gavel className="h-5 w-5" /> Live Auctions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-exotic-black to-transparent" />
      </section>

      {/* Features */}
      <section className="py-24 bg-exotic-carbon">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl font-bold text-center text-exotic-gold-light mb-16"
          >
            Everything You Need
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={f.href} className="block">
                  <div className="glass-card-hover p-8 h-full group">
                    <f.icon className="h-12 w-12 text-exotic-gold mb-4 group-hover:scale-110 transition" />
                    <h3 className="font-display text-xl font-semibold text-exotic-gold mb-2">
                      {f.title}
                    </h3>
                    <p className="text-white/60">{f.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold text-exotic-gold-light"
            >
              Featured Listings
            </motion.h2>
            <Link href="/cars">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(featured || []).slice(0, 4).map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/cars/${car.id}`}>
                  <div className="glass-card-hover overflow-hidden group">
                    <div className="aspect-video bg-exotic-smoke relative overflow-hidden">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-exotic-gold-light">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-white/60 text-sm">{car.year}</p>
                      {car.price != null && (
                        <p className="text-exotic-gold font-semibold mt-2">
                          ${car.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-exotic-carbon">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center"
        >
          <h2 className="font-display text-4xl font-bold text-exotic-gold-light mb-4">
            Ready to Join the Elite?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Create your account, list your cars, or start bidding on the world&apos;s
            most exclusive modified vehicles.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Zap className="h-5 w-5" /> Get Started Free
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
