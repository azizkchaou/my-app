import Image from "next/image";
import Link from "next/link";

const options = [
  {
    title: "Invest in Startups",
    description:
      "Back high-potential founders and emerging technology with conviction.",
    href: "/invest/invest4good/startups",
    image: "/startup.png",
    accent: "from-amber-400/60 via-amber-500/20 to-transparent",
  },
  {
    title: "Invest in Sustainable Energy",
    description:
      "Fuel the transition to a cleaner economy with resilient assets.",
    href: "/invest/invest4good/sustainable-energy",
    image: "/energy.png",
    accent: "from-emerald-400/60 via-emerald-500/20 to-transparent",
  },
];

const Invest4GoodPage = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]">
      <div className="container mx-auto px-6 pb-16 pt-24">
        <div className="flex items-center justify-between">
          <Link
            href="/invest"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:-translate-y-0.5 hover:bg-white"
          >
            Back to Invest
          </Link>
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Invest4Good
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Impact-first opportunities
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Choose where your capital creates growth and positive change.
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
                width={1200}
                height={800}
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

export default Invest4GoodPage;
