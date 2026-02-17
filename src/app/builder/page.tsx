"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CAR_MODELS = [
  { brand: "BMW", models: ["335i", "M3", "M4"] },
  { brand: "Mercedes", models: ["C63", "E63", "AMG GT"] },
  { brand: "Audi", models: ["RS5", "RS7", "R8"] },
  { brand: "Porsche", models: ["911", "Cayman", "Panamera"] },
];

export default function UpgradeBuilderPage() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [targetHp, setTargetHp] = useState("");

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-exotic-gold-light mb-2">
          Upgrade Builder
        </h1>
        <p className="text-white/60">
          Select your car and desired performance. Get compatible parts and cost estimate.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl"
      >
        <Card className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Car Model</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setModel("");
                }}
                className="flex h-10 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-exotic-gold-light"
              >
                <option value="">Select brand</option>
                {CAR_MODELS.map((b) => (
                  <option key={b.brand} value={b.brand}>
                    {b.brand}
                  </option>
                ))}
              </select>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!brand}
                className="flex h-10 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-exotic-gold-light"
              >
                <option value="">Select model</option>
                {CAR_MODELS.find((b) => b.brand === brand)?.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Target Horsepower
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={targetHp}
              onChange={(e) => setTargetHp(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-exotic-gold-light"
            />
          </div>
          <Button className="w-full gap-2">
            <Zap className="h-4 w-4" /> Get Recommendations
          </Button>
        </Card>

        <div className="mt-8 glass-card p-8 text-center text-white/60">
          <Wrench className="h-16 w-16 mx-auto mb-4 opacity-40" />
          <p>
            AI-powered part recommendations and cost estimation coming soon.
            Select your car and target HP to get started.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
