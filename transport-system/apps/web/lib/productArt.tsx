'use client';
import React from 'react';

/**
 * In-app product illustrations. Because the marketplace is deployed as a static
 * export with no reliable external image host, product imagery is drawn as SVG
 * keyed by `imageKey` (see prisma/seed-data.ts). This guarantees crisp, on-brand,
 * never-broken visuals — a real photo `imageUrl` can still override when present.
 */

type Cat = 'SEEDS' | 'PESTICIDES' | 'FERTILIZER' | 'TOOLS' | string;

const PALETTE: Record<string, { bg: string; bg2: string; accent: string; ink: string }> = {
  SEEDS:      { bg: '#eaf7ec', bg2: '#d3edd8', accent: '#2e7d32', ink: '#1b5e20' },
  PESTICIDES: { bg: '#fff3e6', bg2: '#ffe4c4', accent: '#ef6c00', ink: '#b34700' },
  FERTILIZER: { bg: '#e9f1fc', bg2: '#d3e3f7', accent: '#1565c0', ink: '#0d3f7a' },
  TOOLS:      { bg: '#eef1f4', bg2: '#dfe5ea', accent: '#455a64', ink: '#263238' },
};

function pal(cat: Cat) {
  return PALETTE[cat] ?? PALETTE.TOOLS;
}

// A jug/bottle with a coloured label band (crop-protection products).
function Jug({ label }: { label: string }) {
  return (
    <g>
      <rect x="128" y="66" width="64" height="18" rx="4" fill="#cfd8dc" />
      <rect x="146" y="52" width="28" height="18" rx="3" fill="#b0bec5" />
      <path d="M116 84 h88 a10 10 0 0 1 10 10 v78 a14 14 0 0 1 -14 14 h-80 a14 14 0 0 1 -14 -14 v-78 a10 10 0 0 1 10 -10 z" fill="#eceff1" stroke="#b0bec5" strokeWidth="2" />
      <rect x="112" y="112" width="96" height="46" rx="4" fill={label} />
      <rect x="120" y="122" width="80" height="7" rx="3.5" fill="#ffffff" opacity="0.9" />
      <rect x="120" y="135" width="58" height="6" rx="3" fill="#ffffff" opacity="0.7" />
      <rect x="120" y="146" width="44" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
    </g>
  );
}

// A poly sack (seed / fertilizer).
function Sack({ tag, c, ink }: { tag: string; c: string; ink: string }) {
  return (
    <g>
      <path d="M104 70 q56 -16 112 0 l-8 118 a10 10 0 0 1 -10 9 h-76 a10 10 0 0 1 -10 -9 z" fill="#f4efe6" stroke="#d8ccb4" strokeWidth="2" />
      <path d="M104 70 q56 14 112 0" fill="none" stroke="#d8ccb4" strokeWidth="2" />
      <rect x="120" y="104" width="80" height="52" rx="5" fill={c} />
      <text x="160" y="138" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="1">{tag}</text>
      <rect x="130" y="166" width="60" height="6" rx="3" fill={ink} opacity="0.25" />
    </g>
  );
}

// crop glyphs sit on top of a sack for seed products
function seedTile(kind: string, p: { accent: string; ink: string }) {
  const glyphs: Record<string, React.ReactNode> = {
    corn: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🌽</text>,
    soybean: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🫘</text>,
    wheat: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🌾</text>,
    sorghum: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🌾</text>,
    alfalfa: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🍀</text>,
    covercrop: <text x="160" y="139" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">🌱</text>,
  };
  return (
    <g>
      <path d="M104 70 q56 -16 112 0 l-8 118 a10 10 0 0 1 -10 9 h-76 a10 10 0 0 1 -10 -9 z" fill="#f4efe6" stroke="#d8ccb4" strokeWidth="2" />
      <path d="M104 70 q56 14 112 0" fill="none" stroke="#d8ccb4" strokeWidth="2" />
      <rect x="118" y="104" width="84" height="50" rx="6" fill={p.accent} />
      {glyphs[kind] ?? glyphs.corn}
    </g>
  );
}

function toolTile(kind: string, p: { accent: string; ink: string }) {
  switch (kind) {
    case 'backpack':
      return (
        <g stroke={p.ink} strokeWidth="3" fill="none">
          <rect x="118" y="70" width="54" height="88" rx="12" fill={p.accent} stroke="none" />
          <path d="M124 74 q-18 30 -6 78" />
          <path d="M172 96 h24 l10 60" />
          <circle cx="206" cy="164" r="6" fill={p.ink} stroke="none" />
        </g>
      );
    case 'atvsprayer':
      return (
        <g>
          <rect x="112" y="92" width="70" height="52" rx="10" fill={p.accent} />
          <rect x="120" y="102" width="54" height="10" rx="5" fill="#fff" opacity="0.85" />
          <circle cx="130" cy="176" r="16" fill={p.ink} /><circle cx="176" cy="176" r="16" fill={p.ink} />
          <path d="M182 100 h26 l-4 -22" stroke={p.ink} strokeWidth="4" fill="none" />
        </g>
      );
    case 'soiltest':
      return (
        <g>
          <rect x="140" y="66" width="18" height="96" rx="9" fill="#e0f2f1" stroke={p.ink} strokeWidth="2" />
          <rect x="140" y="120" width="18" height="42" rx="9" fill={p.accent} />
          <rect x="170" y="80" width="18" height="82" rx="9" fill="#e0f2f1" stroke={p.ink} strokeWidth="2" />
          <rect x="170" y="128" width="18" height="34" rx="9" fill="#7cb342" />
        </g>
      );
    case 'drip':
      return (
        <g stroke={p.accent} strokeWidth="6" fill="none">
          <path d="M104 108 h112" />
          {[128, 150, 172, 194].map((x) => (
            <g key={x}><path d={`M${x} 108 v14`} /><circle cx={x} cy={132} r="4" fill={p.accent} stroke="none" /></g>
          ))}
        </g>
      );
    case 'shears':
      return (
        <g stroke={p.ink} strokeWidth="4" fill="none">
          <path d="M120 150 l44 -58" stroke={p.accent} strokeWidth="8" />
          <path d="M132 150 l44 -58" />
          <circle cx="118" cy="156" r="10" /><circle cx="134" cy="158" r="10" />
        </g>
      );
    case 'fence':
      return (
        <g stroke={p.accent} strokeWidth="3" fill="none">
          {[100, 130, 160, 190, 220].map((x) => <path key={x} d={`M${x} 78 v96`} />)}
          {[96, 116, 136, 156].map((y) => <path key={y} d={`M100 ${y} h120`} />)}
        </g>
      );
    case 'gloves':
      return (
        <g>
          <path d="M132 88 v-16 a8 8 0 0 1 16 0 v14 M148 86 v-22 a8 8 0 0 1 16 0 v22 M164 86 v-18 a8 8 0 0 1 16 0 v20" fill={p.accent} stroke={p.ink} strokeWidth="2" />
          <path d="M124 96 q-2 -12 10 -12 h52 a10 10 0 0 1 10 10 v44 a30 30 0 0 1 -30 30 h-18 a26 26 0 0 1 -26 -26 z" fill={p.accent} stroke={p.ink} strokeWidth="2" />
        </g>
      );
    default:
      return <text x="160" y="150" textAnchor="middle" fontSize="60">🧰</text>;
  }
}

export function ProductArt({ imageKey, category, className }: { imageKey?: string; category?: Cat; className?: string }) {
  const cat = (category ?? 'TOOLS') as string;
  const p = pal(cat);
  const key = imageKey ?? '';

  let body: React.ReactNode;
  if (['corn', 'soybean', 'wheat', 'sorghum', 'alfalfa', 'covercrop'].includes(key)) {
    body = seedTile(key, p);
  } else if (['herbicide', 'insecticide', 'fungicide', 'adjuvant'].includes(key)) {
    const labelColor = key === 'herbicide' ? '#43a047' : key === 'insecticide' ? '#ef6c00' : key === 'fungicide' ? '#8e24aa' : '#00897b';
    body = <Jug label={labelColor} />;
  } else if (['fertilizer', 'lime', 'micronutrient'].includes(key)) {
    const tag = key === 'micronutrient' ? 'Zn' : key === 'lime' ? 'Ca' : 'N-P-K';
    body = <Sack tag={tag} c={p.accent} ink={p.ink} />;
  } else if (key === 'liquidfert') {
    body = (
      <g>
        <rect x="118" y="74" width="84" height="104" rx="12" fill={p.accent} />
        <rect x="118" y="74" width="84" height="30" rx="12" fill="#fff" opacity="0.18" />
        <rect x="130" y="120" width="60" height="42" rx="6" fill="#fff" opacity="0.92" />
        <text x="160" y="148" textAnchor="middle" fontSize="15" fontWeight="800" fill={p.ink}>32-0-0</text>
        <rect x="150" y="60" width="20" height="16" rx="3" fill="#90a4ae" />
      </g>
    );
  } else {
    body = toolTile(key, p);
  }

  return (
    <svg className={className} viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={key || cat}>
      <rect width="320" height="240" fill={p.bg} />
      <rect width="320" height="240" fill={p.bg2} opacity="0.55" transform="skewY(-4)" />
      <ellipse cx="160" cy="210" rx="86" ry="16" fill={p.ink} opacity="0.08" />
      {body}
    </svg>
  );
}
