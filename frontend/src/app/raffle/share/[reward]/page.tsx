import type { Metadata } from 'next';
import Link from 'next/link';

type RewardConfig = {
  title: string;
  subtitle: string;
};

const REWARD_META: Record<string, RewardConfig> = {
  five_percent: {
    title: 'I won 5% OFF',
    subtitle: 'Meal dishes only. Not drinks or other items.',
  },
  ten_percent: {
    title: 'I won 10% OFF',
    subtitle: 'Meal dishes only. Not drinks or other items.',
  },
  free_delivery: {
    title: 'I won 12% OFF',
    subtitle: 'Meal dishes only. Not drinks or other items.',
  },
  fifty_percent_first_meal: {
    title: 'I won 50% OFF one meal',
    subtitle: 'Meal dishes only. Max GHS 25. Not drinks or other items.',
  },
  free_water: {
    title: 'I won Free Water',
    subtitle: 'Crave & Co Spin & Win reward unlocked.',
  },
  win: {
    title: 'I just won on Spin & Win',
    subtitle: 'Try your luck and win real rewards at Crave & Co.',
  },
};

function resolveReward(reward: string): RewardConfig {
  return REWARD_META[reward] ?? REWARD_META.win;
}

export async function generateMetadata({ params }: { params: Promise<{ reward: string }> }): Promise<Metadata> {
  const { reward } = await params;
  const r = resolveReward(reward);
  const pagePath = `/raffle/share/${reward}`;
  const ogImagePath = `${pagePath}/opengraph-image`;

  return {
    title: `${r.title} | Crave & Co Spin & Win`,
    description: `${r.title}. ${r.subtitle}`,
    openGraph: {
      title: `${r.title} | Crave & Co`,
      description: r.subtitle,
      type: 'website',
      url: pagePath,
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: `${r.title} - Crave & Co Spin & Win` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${r.title} | Crave & Co`,
      description: r.subtitle,
      images: [ogImagePath],
    },
  };
}

export default async function RaffleSharePage({ params }: { params: Promise<{ reward: string }> }) {
  const { reward } = await params;
  const r = resolveReward(reward);

  return (
    <main className="min-h-screen bg-[#120903] text-white">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#e8a45a]">Crave & Co</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{r.title}</h1>
        <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">{r.subtitle}</p>
        <p className="mt-2 text-xs text-white/45">Spin & Win rewards expire in 24 hours and are verified at checkout.</p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3">
          <Link
            href="/raffle"
            className="rounded-full bg-gradient-to-r from-[#b5451b] via-[#e8803a] to-[#f59e0b] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_40px_rgba(181,69,27,0.35)]"
          >
            Spin Now
          </Link>
          <Link
            href="/menu"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white/85"
          >
            Browse Menu
          </Link>
        </div>
      </section>
    </main>
  );
}