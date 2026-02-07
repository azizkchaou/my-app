import Image from "next/image";
import Link from "next/link";

import investImage from "@/assets/invest.png";
import tradingImage from "@/assets/trade.png";

const options = [
  {
    title: "Invest4Good",
    description:
      "Purpose-driven portfolios that align impact with long-term growth.",
    href: "/invest/invest4good",
    image: investImage,
    accent: "from-emerald-400/60 via-emerald-500/20 to-transparent",
  },
  {
    title: "Trading",
    description:
      "Active strategies, real-time insights, and precise execution tools.",
    href: "/ai-agents",
    image: tradingImage,
    accent: "from-sky-400/60 via-indigo-500/20 to-transparent",
  },
];

const InvestPage = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]">
      <div className="container mx-auto px-6 pb-16 pt-28">
        <div className="mx-auto max-w-3xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Investment Options
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Choose your path to smarter growth
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Explore premium investment experiences built for modern, confident decisions.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {options.map((option, index) => (
            <Link
              key={option.title}
              href={option.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300/40 animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${140 + index * 120}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent opacity-90" />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${option.accent} opacity-70 mix-blend-screen transition-opacity duration-300 group-hover:opacity-90`}
              />
              <Image
                src={option.image}
                alt={option.title}
                className="h-[420px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                priority={index === 0}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold sm:text-3xl">
                      {option.title}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-slate-100 sm:text-base">
                      {option.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                    Explore
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 ring-1 ring-transparent transition duration-300 group-hover:ring-white/30" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
