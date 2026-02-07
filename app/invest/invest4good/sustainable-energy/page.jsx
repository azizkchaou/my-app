"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ENERGY_TYPES = [
  {
    key: "Wind",
    title: "Wind Energy",
    description: "Harness offshore and onshore wind corridors.",
    image: "/energy.png",
    accent: "from-sky-400/60 via-sky-500/20 to-transparent",
  },
  {
    key: "Solar",
    title: "Solar Energy",
    description: "Scale modular solar arrays with predictable yield.",
    image: "/energy.png",
    accent: "from-amber-400/60 via-amber-500/20 to-transparent",
  },
  {
    key: "Hydro",
    title: "Hydro Energy",
    description: "Invest in resilient hydro infrastructure and storage.",
    image: "/energy.png",
    accent: "from-indigo-400/60 via-indigo-500/20 to-transparent",
  },
  {
    key: "Biomass",
    title: "Biomass Energy",
    description: "Power circular supply chains with bioenergy.",
    image: "/energy.png",
    accent: "from-emerald-400/60 via-emerald-500/20 to-transparent",
  },
];

const MIN_INVESTMENT = 100;

const SustainableEnergyPage = () => {
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const handleOpen = (energy) => {
    setSelectedEnergy(energy);
    setIsDialogOpen(true);
    setError("");
    setPrediction(null);
  };

  const handleClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setError("");
      setPrediction(null);
    }
  };

  const handlePredict = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount)) {
      setError("Enter a valid investment amount.");
      return;
    }

    if (numericAmount < MIN_INVESTMENT) {
      setError(`Minimum investment is $${MIN_INVESTMENT}.`);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/energy-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment_amount: numericAmount,
          energy_type: selectedEnergy?.key,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setPrediction(data.predicted_kwh);
    } catch (fetchError) {
      setError(fetchError.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]">
      <div className="container mx-auto px-6 pb-16 pt-24">
        <div className="flex items-center justify-between">
          <Link
            href="/invest/invest4good"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:-translate-y-0.5 hover:bg-white"
          >
            Back to Invest4Good
          </Link>
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Sustainable Energy
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Build clean energy portfolios
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Select an energy segment to estimate production based on your investment.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {ENERGY_TYPES.map((energy, index) => (
            <button
              key={energy.key}
              type="button"
              onClick={() => handleOpen(energy)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 text-left shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300/40 animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${140 + index * 120}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent opacity-90" />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${energy.accent} opacity-70 mix-blend-screen transition-opacity duration-300 group-hover:opacity-90`}
              />
              <Image
                src={energy.image}
                alt={energy.title}
                width={1200}
                height={800}
                className="h-[340px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold sm:text-3xl">
                      {energy.title}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-slate-100 sm:text-base">
                      {energy.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                    Predict
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 ring-1 ring-transparent transition duration-300 group-hover:ring-white/30" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {selectedEnergy?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              How much money do you want to invest?
            </p>
            <Input
              type="number"
              min={MIN_INVESTMENT}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-12 text-lg"
              placeholder="Enter amount"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="button"
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Predicting..." : "Predict Income"}
            </Button>

            {prediction !== null && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Estimated Energy Production
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {Number(prediction).toFixed(2)} kWh
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button type="button" className="flex-1">
                    Invest Now
                  </Button>
                  <Link href="/invest/invest4good" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Go Back
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SustainableEnergyPage;
