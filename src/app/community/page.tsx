"use client";

import { motion } from "framer-motion";
import { Users, MapPin } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Community
        </h1>
        <p className="text-white/60">
          Connect with car enthusiasts worldwide
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-12 text-center"
      >
        <Users className="h-24 w-24 text-exotic-gold mx-auto mb-6 opacity-60" />
        <h2 className="font-display text-2xl font-semibold text-exotic-gold-light mb-4">
          Join the Elite Community
        </h2>
        <p className="text-white/70 max-w-xl mx-auto mb-8">
          Follow builders, share your garage, join event chat groups, and upload
          photos from meets. The community features are coming soon.
        </p>
      </motion.div>
    </div>
  );
}
