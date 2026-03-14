"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, PiggyBank } from "lucide-react";

export default function ROICalculator() {
  const [entities, setEntities] = useState(25);
  const [costPerEntity, setCostPerEntity] = useState(400);

  const calculations = useMemo(() => {
    const currentAnnual = entities * costPerEntity * 12;

    // Tiered pricing from constants
    let bkaiPerEntity: number;
    if (entities <= 10) bkaiPerEntity = 249;
    else if (entities <= 50) bkaiPerEntity = 179;
    else bkaiPerEntity = 119;

    const bkaiAnnual = entities * bkaiPerEntity * 12;
    const savings = currentAnnual - bkaiAnnual;
    const roi = currentAnnual > 0 ? ((savings / currentAnnual) * 100) : 0;

    return {
      currentAnnual,
      bkaiAnnual,
      savings,
      roi,
      bkaiPerEntity,
    };
  }, [entities, costPerEntity]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-teal-300 uppercase">
            ROI Calculator
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            See How Much{" "}
            <span className="bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">
              You Could Save
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Adjust the sliders to estimate your annual savings with BookkeeperAI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-14 max-w-4xl"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-8">
                {/* Entities slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Number of Entities
                    </label>
                    <span className="rounded-lg bg-teal-400/10 px-3 py-1 text-sm font-semibold text-teal-300">
                      {entities}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={entities}
                    onChange={(e) => setEntities(Number(e.target.value))}
                    className="mt-3 w-full h-2 rounded-full appearance-none cursor-pointer bg-white/[0.06] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(45,212,191,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-600">
                    <span>1</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Cost slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Current Cost per Entity
                    </label>
                    <span className="rounded-lg bg-teal-400/10 px-3 py-1 text-sm font-semibold text-teal-300">
                      {formatCurrency(costPerEntity)}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={800}
                    step={25}
                    value={costPerEntity}
                    onChange={(e) => setCostPerEntity(Number(e.target.value))}
                    className="mt-3 w-full h-2 rounded-full appearance-none cursor-pointer bg-white/[0.06] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(45,212,191,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-600">
                    <span>$200</span>
                    <span>$800</span>
                  </div>
                </div>

                {/* Tier info */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Your BookkeeperAI Tier
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {entities <= 10
                      ? "Starter"
                      : entities <= 50
                        ? "Growth"
                        : "Enterprise"}{" "}
                    &mdash;{" "}
                    <span className="text-teal-300 font-semibold">
                      {formatCurrency(calculations.bkaiPerEntity)}/entity/mo
                    </span>
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-4">
                <ResultCard
                  icon={DollarSign}
                  label="Current Annual Cost"
                  value={formatCurrency(calculations.currentAnnual)}
                  color="slate"
                />
                <ResultCard
                  icon={Calculator}
                  label="BookkeeperAI Annual"
                  value={formatCurrency(calculations.bkaiAnnual)}
                  color="teal"
                />
                <ResultCard
                  icon={PiggyBank}
                  label="Annual Savings"
                  value={formatCurrency(calculations.savings)}
                  color="amber"
                  highlight
                />
                <ResultCard
                  icon={TrendingUp}
                  label="ROI"
                  value={`${calculations.roi.toFixed(0)}%`}
                  color="teal"
                  highlight
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  const colorMap: Record<string, { iconBg: string; iconColor: string; valueColor: string }> = {
    slate: {
      iconBg: "from-slate-500/15 to-slate-500/5",
      iconColor: "text-slate-400",
      valueColor: "text-slate-200",
    },
    teal: {
      iconBg: "from-teal-500/15 to-teal-500/5",
      iconColor: "text-teal-400",
      valueColor: "text-teal-300",
    },
    amber: {
      iconBg: "from-amber-500/15 to-amber-500/5",
      iconColor: "text-amber-400",
      valueColor: "text-amber-300",
    },
  };

  const c = colorMap[color] || colorMap.slate;

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all ${
        highlight
          ? "border-white/[0.08] bg-white/[0.04]"
          : "border-white/[0.04] bg-white/[0.01]"
      }`}
    >
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.iconBg} ${c.iconColor}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs text-slate-500 font-medium">{label}</p>
      <p className={`mt-1 text-xl font-bold ${c.valueColor}`}>{value}</p>
    </div>
  );
}
