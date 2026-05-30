import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const REWARD_META: Record<string, { title: string; badge: string; note: string }> = {
  five_percent: {
    title: 'I WON 5% OFF',
    badge: 'MEAL DISHES ONLY',
    note: 'Not drinks or other items',
  },
  ten_percent: {
    title: 'I WON 10% OFF',
    badge: 'MEAL DISHES ONLY',
    note: 'Not drinks or other items',
  },
  free_delivery: {
    title: 'I WON 12% OFF',
    badge: 'MEAL DISHES ONLY',
    note: 'Not drinks or other items',
  },
  fifty_percent_first_meal: {
    title: 'I WON 50% OFF',
    badge: 'ONE MEAL DISH',
    note: 'Max GHS 25 · Not drinks or other items',
  },
  free_water: {
    title: 'I WON FREE WATER',
    badge: 'CRAVE & CO SPIN & WIN',
    note: 'Reward valid at checkout within 24 hours',
  },
  win: {
    title: 'I WON ON SPIN & WIN',
    badge: 'CRAVE & CO',
    note: 'Play daily and unlock rewards',
  },
};

function resolveReward(reward: string) {
  return REWARD_META[reward] ?? REWARD_META.win;
}

export default async function Image({ params }: { params: Promise<{ reward: string }> }) {
  const { reward } = await params;
  const data = resolveReward(reward);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #130904 0%, #2e1208 45%, #4a1c09 100%)',
          color: 'white',
          padding: '56px 64px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 440,
            height: 440,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(245,158,11,0.34) 0%, rgba(245,158,11,0) 72%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -150,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(181,69,27,0.32) 0%, rgba(181,69,27,0) 72%)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 18px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.24)',
                background: 'rgba(255,255,255,0.08)',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              CRAVE & CO. SPIN & WIN
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 86, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{data.title}</div>
              <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.88)', fontWeight: 700 }}>{data.note}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 18px',
                borderRadius: 999,
                border: '1px solid rgba(232,164,90,0.6)',
                background: 'rgba(232,164,90,0.14)',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              {data.badge}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f8c27a' }}>Play at craveandco</div>
              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.76)' }}>Reward valid for 24 hours</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}