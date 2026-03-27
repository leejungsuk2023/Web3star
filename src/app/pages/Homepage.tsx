import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Download,
  Globe2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Twitter,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import heroImage from '../../assets/web3star-hero-creation.png';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';

const navItems = [
  { label: 'Process', href: '#process' },
  { label: 'Whitepaper', href: '#whitepaper' },
  { label: 'Tokenomics', href: '#tokenomics' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Download', href: '#download' },
  { label: 'Community', href: '#community' },
];

/** 스토어 링크 연결 전까지 placeholder. `/TODO-*` 는 클릭해도 이동하지 않음. */
const ANDROID_STORE_PLACEHOLDER_HREF = '/TODO-ANDROID';
const IOS_STORE_PLACEHOLDER_HREF = '/TODO-IOS';

function isTodoStoreHref(href: string) {
  return href.startsWith('/TODO-');
}

const roadmapItems = [
  {
    phase: '01',
    title: 'Mining App Launch',
    points: [
      'Release Web3Star mining app',
      'Activate core reward flow and wallet integration',
      'Collect feedback and improve UX/performance',
    ],
  },
  {
    phase: '02',
    title: 'Wallet & Core Architecture',
    points: [
      'Start Web3Star Wallet (store and transfer)',
      'Build platform base architecture and beta prep',
      'Begin security audit for smart contracts',
    ],
  },
  {
    phase: '03',
    title: 'Platform Beta',
    points: [
      'Launch platform beta with creator token issuance',
      'Open creator onboarding and education',
      'Apply initial ad-revenue distribution model',
    ],
  },
  {
    phase: '04',
    title: 'Coin Launch & Multi-chain',
    points: [
      'Official launch of Web3Star Coin ($W3S)',
      'Distribution for mining, team, ecosystem',
      'Expand wallet to EVM and Solana',
    ],
  },
  {
    phase: '05',
    title: 'DEX, NFT, DAO',
    points: [
      'List on DEX and bootstrap liquidity pools',
      'Enable NFT issuance and trading',
      'Introduce DAO governance for token holders',
    ],
  },
  {
    phase: '06',
    title: 'Global Launch',
    points: [
      'CEX listing and global marketing rollout',
      'Partnerships with ad/content/NFT ecosystems',
      'Release full platform (mobile + web)',
    ],
  },
];

/** 합계 100% — 백서 구간과 정합 · 시안 계열 */
const tokenomicsSegments = [
  {
    label: 'Mobile Mining Rewards',
    pct: 42,
    display: '40–45%',
    supplyB: '40–45B',
    color: '#22d3ee',
    detail: 'Largest slice: cloud mining, referrals, and early network effects.',
  },
  {
    label: 'Ecosystem & Partnerships',
    pct: 18,
    display: '15–20%',
    supplyB: '15–20B',
    color: '#38bdf8',
    detail: 'Integrations, grants, and strategic partners that expand utility.',
  },
  {
    label: 'Core Team (Vested)',
    pct: 15,
    display: '15%',
    supplyB: '15B',
    color: '#60a5fa',
    detail: 'Cliff & vesting schedule; aligned with long-term delivery.',
  },
  {
    label: 'Community Growth',
    pct: 12,
    display: '10%',
    supplyB: '10B',
    color: '#2dd4bf',
    detail: 'Campaigns, education, airdrops, and user acquisition programs.',
  },
  {
    label: 'Development Reserve',
    pct: 13,
    display: '7–10%',
    supplyB: '7–10B',
    color: '#fbbf24',
    detail: 'Security audits, protocol R&D, and infrastructure runway.',
  },
] as const;

/** SVG 도넛 슬라이스 (도 단위, -90° = 12시 방향) */
function donutAnnulusPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const pt = (r: number, d: number) => ({
    x: cx + r * Math.cos(rad(d)),
    y: cy + r * Math.sin(rad(d)),
  });
  const o1 = pt(rOuter, startDeg);
  const o2 = pt(rOuter, endDeg);
  const i2 = pt(rInner, endDeg);
  const i1 = pt(rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${rInner} ${rInner} 0 ${large} 0 ${i1.x} ${i1.y} Z`;
}

function TokenomicsDonutChart({ className }: { className?: string }) {
  const cx = 50;
  const cy = 50;
  const rOuter = 43.5;
  const rInner = 25.5;
  const gapDeg = 1.15;
  const n = tokenomicsSegments.length;
  const totalGap = gapDeg * n;
  const usable = 360 - totalGap;
  let angle = -90 + gapDeg / 2;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <filter id="tok-donut-glow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="tok-donut-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
          <stop offset="50%" stopColor="rgba(59,130,246,0.2)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0.25)" />
        </linearGradient>
        <radialGradient id="tok-donut-hub-shine" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={rOuter + 3.2}
        fill="none"
        stroke="url(#tok-donut-orbit)"
        strokeWidth="0.55"
        opacity={0.85}
      />
      <circle cx={cx} cy={cy} r={rOuter + 1.4} fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="0.35" />

      {tokenomicsSegments.map((s) => {
        const sweep = (s.pct / 100) * usable;
        const start = angle;
        const end = angle + sweep;
        angle = end + gapDeg;
        return (
          <path
            key={s.label}
            d={donutAnnulusPath(cx, cy, rOuter, rInner, start, end)}
            fill={s.color}
            filter="url(#tok-donut-glow)"
            opacity={0.96}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.12"
            strokeLinejoin="round"
            className="origin-center transition-[opacity,transform] duration-200 hover:opacity-100 hover:brightness-110"
          />
        );
      })}

      <circle cx={cx} cy={cy} r={rInner - 0.35} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="0.4" />
      <circle cx={cx} cy={cy} r={rInner - 0.9} fill="url(#tok-donut-hub-shine)" opacity={0.9} />
    </svg>
  );
}

const downloadSteps = [
  'Download the Android app package (APK or store listing when available).',
  'Sign up with Google and, if you have a referral code, add it (optional).',
  'Activate mining every 4 hours and complete KYC to qualify for token distribution.',
] as const;

const communityChannels: {
  label: string;
  detail: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  soon?: boolean;
}[] = [
  {
    label: 'Website',
    detail: 'web3star.org',
    href: 'https://web3star.org',
    icon: Globe2,
    external: true,
  },
  {
    label: 'X (Twitter)',
    detail: 'x.com/Web3starOrg',
    href: 'https://x.com/Web3starOrg',
    icon: Twitter,
    external: true,
  },
  {
    label: 'Email',
    detail: 'support@web3star.org',
    href: 'mailto:support@web3star.org',
    icon: Mail,
    external: false,
  },
  { label: 'Telegram', detail: 'Community announcements', icon: Send, soon: true },
  { label: 'Discord', detail: 'Builders & support', icon: MessageCircle, soon: true },
];

function RoadmapPhaseCard({
  item,
  stepIndex,
  compact = false,
}: {
  item: (typeof roadmapItems)[number];
  stepIndex: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-500/18 bg-[#0c0c0c] shadow-[0_0_28px_rgba(6,182,212,0.05)] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-cyan-400/70 before:via-sky-500/40 before:to-blue-600/30 ${
        compact ? 'rounded-xl p-4' : 'p-5'
      }`}
    >
      <div
        className={`pointer-events-none absolute right-2 top-1 select-none font-black tabular-nums leading-none text-cyan-400/[0.07] ${
          compact ? 'text-4xl' : 'text-5xl sm:text-6xl right-3 top-2'
        }`}
        aria-hidden
      >
        {item.phase}
      </div>
      <div className={`relative z-[1] flex items-center gap-2 ${compact ? 'gap-2.5' : 'gap-3'}`}>
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 font-bold text-cyan-200 tabular-nums ${
            compact ? 'h-8 w-8 text-xs' : 'h-9 w-9 rounded-xl text-sm'
          }`}
        >
          {stepIndex}
        </span>
        <div className="min-w-0">
          <p
            className={`font-semibold uppercase tracking-wider text-cyan-400/85 ${
              compact ? 'text-[10px]' : 'text-[11px]'
            }`}
          >
            Phase {item.phase}
          </p>
          <h3 className={`font-semibold leading-snug text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {item.title}
          </h3>
        </div>
      </div>
      <ul
        className={`relative z-[1] flex flex-1 flex-col text-gray-400 ${
          compact ? 'mt-3 gap-1.5 text-xs leading-relaxed' : 'mt-4 gap-2.5 text-sm leading-relaxed'
        }`}
      >
        {item.points.map((p) => (
          <li key={p} className={`flex gap-2 border-l border-cyan-500/20 pl-2.5 ${compact ? 'gap-1.5 pl-2' : 'gap-2.5 pl-3'}`}>
            <span
              className={`mt-1 shrink-0 rounded-full bg-cyan-400/50 ${compact ? 'h-0.5 w-0.5' : 'mt-1.5 h-1 w-1'}`}
              aria-hidden
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** 로드맵: 짧은 흐름 스트립 + 3열 그리드(읽는 순서 = 시간 순서) — 세로 길이 최소화 */
function ProcessRoadmapTimeline() {
  return (
    <section
      id="process"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-6 md:px-8 md:py-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">Process / Roadmap</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-snug text-gray-400">
              Six phases in order.
            </p>
          </div>
          <p className="mt-2 shrink-0 text-xs font-medium tabular-nums text-cyan-400/90 sm:mt-1">01 → 06</p>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-x-0 gap-y-1.5 text-[11px] font-medium text-cyan-500/45"
          aria-hidden
        >
          {roadmapItems.map((item, i) => (
            <React.Fragment key={`seq-${item.phase}`}>
              {i > 0 && <span className="px-1.5 sm:px-2">→</span>}
              <span
                className="rounded border border-cyan-500/25 bg-cyan-500/[0.07] px-2 py-0.5 tabular-nums text-cyan-200/95"
                title={item.title}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-7">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roadmapItems.map((item, i) => (
            <RoadmapPhaseCard key={item.phase} item={item} stepIndex={i + 1} compact />
          ))}
        </div>
      </div>
    </section>
  );
}

function TokenomicsSection() {
  return (
    <section
      id="tokenomics"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-400">Supply design</p>
        <h2 className="mt-1.5 text-xl font-bold text-white md:text-2xl">Tokenomics</h2>
        <p className="mt-1 max-w-3xl text-xs leading-snug text-gray-400 md:text-sm">
          Illustrative allocation for Web3Star ($W3S) on a 100B max supply. Model weights sum to 100%; public
          sale and vesting mechanics will be confirmed with audits and governance.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { k: 'Symbol', v: '$W3S' },
            { k: 'Max supply', v: '100B' },
            { k: 'Chain (plan)', v: 'Solana' },
            { k: 'Allocation', v: '100%' },
          ].map((row) => (
            <div
              key={row.k}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-2.5 py-1.5"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400/80">{row.k}</p>
              <p className="text-sm font-bold tabular-nums text-white">{row.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 md:py-5">
        <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="relative mx-auto w-full max-w-[min(88vw,300px)] sm:max-w-[340px] md:max-w-[380px] lg:col-span-5 lg:mx-0 lg:max-w-none">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[108%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/[0.14] via-blue-600/[0.06] to-transparent blur-3xl"
              aria-hidden
            />
            <div
              className="relative aspect-square w-full"
              role="img"
              aria-label="Web3Star token allocation: five segments totaling one hundred percent of the model pool"
            >
              <TokenomicsDonutChart className="h-full w-full drop-shadow-[0_0_40px_rgba(34,211,238,0.18)]" />
              <div className="absolute inset-[21.5%] z-[2] flex flex-col items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-b from-[#14141c] via-[#0a0a10] to-[#050508] px-2.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(0,0,0,0.4)] sm:px-3 sm:py-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90 sm:text-[9px]">
                  Max supply (cap)
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-3xl md:text-[2rem]">
                  100B
                </p>
                <p className="mt-0.5 text-[9px] text-gray-500 sm:text-[10px]">$W3S tokens · hard ceiling</p>

                <div className="my-2 w-[82%] border-t border-white/10" />

                <p className="text-[10px] font-semibold text-cyan-200/95 sm:text-[11px]">
                  <span className="tabular-nums">$W3S</span>
                  <span className="mx-1 text-gray-600">·</span>
                  <span className="font-normal text-gray-400">Web3Star</span>
                </p>
                <p className="mt-1 max-w-[11rem] text-[8px] leading-snug text-gray-500 sm:max-w-[13rem] sm:text-[9px]">
                  Five allocation pools in this model sum to{' '}
                  <span className="font-medium text-gray-400">100%</span>. The largest slice is mobile mining (
                  <span className="tabular-nums text-cyan-500/80">~42%</span>
                  ).
                </p>
                <p className="mt-1.5 text-[8px] text-gray-600 sm:text-[9px]">Solana (planned) · illustrative only</p>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] leading-snug text-gray-500 lg:text-left">
              Slices are separated for clarity; hover desktop segments for emphasis. Figures align with the
              whitepaper Distribution section.
            </p>
          </div>

          <div className="lg:col-span-7">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Breakdown · % model + indicative $W3S (max 100B)
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Allocation legend and details">
              {tokenomicsSegments.map((s) => (
                <li
                  key={s.label}
                  className="rounded-xl border border-gray-800/90 bg-[#0c0c0c] p-3 shadow-[0_0_20px_rgba(6,182,212,0.04)] transition-colors hover:border-cyan-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                      style={{ backgroundColor: s.color, color: s.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <p className="text-xs font-semibold leading-tight text-white md:text-sm">{s.label}</p>
                        <p className="text-base font-bold tabular-nums text-cyan-200 md:text-lg">{s.pct}%</p>
                      </div>
                      <p className="mt-0.5 text-[11px] tabular-nums text-cyan-500/70">
                        {s.supplyB} $W3S · {s.display} band
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 md:text-xs">{s.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-500/15 bg-[#0c0c0c] px-3 py-3 md:px-4">
          <h3 className="text-xs font-semibold text-cyan-400/90">Distribution principles</h3>
          <ul className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-gray-400 sm:grid-cols-3 sm:gap-x-4 sm:text-xs">
            <li className="flex gap-1.5">
              <span className="text-cyan-500/50">·</span>
              Mining-first rewards for early contributors and network growth.
            </li>
            <li className="flex gap-1.5">
              <span className="text-cyan-500/50">·</span>
              Ecosystem and reserve tranches fund partners, R&amp;D, and runway.
            </li>
            <li className="flex gap-1.5">
              <span className="text-cyan-500/50">·</span>
              Governance can refine weights as the protocol matures.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function DownloadSection() {
  return (
    <section
      id="download"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-400">Mobile app</p>
        <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Download</h2>
        <p className="mt-1 max-w-xl text-xs leading-snug text-gray-400">
          Mining and full product features run in the native app — get started in three steps.
        </p>
      </div>
      <div className="px-4 py-4 md:px-6 md:py-5">
        <ol className="space-y-2">
          {downloadSteps.map((step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/10 text-[11px] font-bold tabular-nums text-cyan-200">
                {i + 1}
              </span>
              <p className="pt-0.5 text-xs leading-snug text-gray-300">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800/80 pt-3">
          <a
            href={ANDROID_STORE_PLACEHOLDER_HREF}
            aria-label="Download on Android (coming soon)"
            className="btn-glow-soft inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-50 opacity-85 hover:opacity-95"
            title="Google Play release coming soon"
            onClick={(e) => {
              if (isTodoStoreHref(ANDROID_STORE_PLACEHOLDER_HREF)) e.preventDefault();
            }}
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Android
          </a>
          <a
            href={IOS_STORE_PLACEHOLDER_HREF}
            aria-label="Download on iOS (coming soon)"
            className="btn-glow-soft inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-700 bg-[#0c0c0c] px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-600"
            title="App Store release coming soon"
            onClick={(e) => {
              if (isTodoStoreHref(IOS_STORE_PLACEHOLDER_HREF)) e.preventDefault();
            }}
          >
            <Apple className="h-3.5 w-3.5 shrink-0" aria-hidden />
            iOS
          </a>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section
      id="community"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-400">Stay connected</p>
        <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Community</h2>
        <p className="mt-1 max-w-xl text-xs leading-snug text-gray-400">
          Official channels for updates, support, and announcements.
        </p>
      </div>
      <div className="px-4 py-4 md:px-6 md:py-5">
        <ul className="grid gap-2 sm:grid-cols-2">
          {communityChannels.map((ch) => (
            <li
              key={ch.label}
              className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-[#0c0c0c] px-3 py-2.5"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  ch.soon ? 'border-gray-700 text-gray-500' : 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300'
                }`}
              >
                <ch.icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400/80">{ch.label}</p>
                {ch.soon ? (
                  <span className="text-[11px] text-gray-500">Coming soon</span>
                ) : ch.href ? (
                  <a
                    href={ch.href}
                    {...(ch.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    className="block truncate text-xs font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    {ch.detail}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const benefitCards: {
  title: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    title: 'Creator-first Economy',
    desc: 'Creators issue personal tokens and monetize directly with transparent revenue sharing.',
    Icon: Sparkles,
  },
  {
    title: 'Low Barrier Entry',
    desc: '4-hour cloud mining works on mobile without hardware cost, battery burden, or complexity.',
    Icon: Smartphone,
  },
  {
    title: 'Web3 Utility',
    desc: 'Token utility, social features, and long-term DAO governance are integrated in one ecosystem.',
    Icon: Globe2,
  },
  {
    title: 'Security by Design',
    desc: 'Bot prevention, KYC before withdrawal, encryption, and smart contract audits.',
    Icon: ShieldCheck,
  },
];

/** 백서 전문 (요약 없음) */
const whitepaperSections = [
  {
    n: 1,
    title: 'Abstract',
    paragraphs: [
      'Web3Star is a decentralized Web3 utility ecosystem designed to make cryptocurrency-powered creative platforms accessible to everyone.',
      'By combining Web 3.0 social media, DAO governance, and smart contract functionality, Web3Star delivers a decentralized economy to billions of mobile users worldwide.',
    ],
  },
  {
    n: 2,
    title: 'Introduction',
    paragraphs: [
      'Web3Star transforms into a blockchain-powered Web3 creative platform. Through our cloud-based mobile mining app, users can earn Web3Star utility tokens without specialized skills or expensive hardware.',
      'By lowering entry barriers with a social media–driven Web3 creative platform, we take the first step toward a more inclusive future for Web 3.0 content creation.',
    ],
  },
  {
    n: 3,
    title: 'The Web3Star Solution',
    bullets: [
      'Users activate mining sessions by tapping a button every 4 hours.',
      'All mining operations are securely simulated and managed on our cloud backend.',
      'This ensures no impact on device performance, battery life, or data usage.',
      'Free access: The app is free to download and use.',
      'Anyone with a smartphone can mine Web3Star utility tokens.',
      'Tokens will be airdropped to users who complete KYC verification after mining points.',
      'Web3 integration: Beyond mining, the app serves as a gateway to token utility, social features, and future DAO governance.',
    ],
  },
  {
    n: 4,
    title: 'Our Vision',
    paragraphs: [
      'Our long-term vision is to establish Web3Star as the core of a dynamic, creator-driven Web3 social ecosystem.',
      'Web3Star enables decentralized social applications for creators.',
      '$W3S tokens can be used for in-app transactions.',
      'Community-driven growth allows creators to issue their own tokens, expanding networks between creators and fans.',
      'Fans can hold creator tokens, evolving into decentralized autonomous organizations (DAOs).',
    ],
  },
  {
    n: 5,
    title: 'Tokenomics',
    lines: [
      'Name: Web3Star',
      'Symbol: $W3S (planned)',
      'Total Supply: 100,000,000,000 $W3S (100 billion)',
      'Blockchain: Solana (planned)',
    ],
  },
  {
    n: 6,
    title: 'Distribution',
    lines: [
      '42% — Mobile mining rewards (42B $W3S)',
      '18% — Ecosystem & partnerships (18B $W3S)',
      '15% — Core team (vested, 15B $W3S)',
      '12% — Community growth (12B $W3S)',
      '13% — Development reserve (13B $W3S)',
    ],
  },
  {
    n: 7,
    title: 'Halving & Mining Rate Reduction',
    paragraphs: [
      'Mining sessions occur every 4 hours. To reward early adopters, $W3S follows a fixed time-based halving schedule that gradually reduces mining rates.',
    ],
  },
  {
    n: 8,
    title: 'Security',
    paragraphs: [
      'Security and trust are paramount. Our multi-layered security model protects both the network and users.',
    ],
    bullets: [
      'Bot prevention: Advanced verification, device fingerprinting, and Captcha systems ensure fair mining by real users.',
      'Account integrity: Mandatory KYC before mainnet withdrawals prevents duplicate accounts and Sybil attacks.',
      'Data security: End-to-end encryption for all user data and communications.',
      'Smart contract audits: $W3S contracts and future protocols are audited by third-party security firms.',
    ],
  },
  {
    n: 9,
    title: 'Contact & Community',
    paragraphs: ['Join our growing community and stay updated on progress.'],
    contacts: [
      { label: 'Web', href: 'https://web3star.org', display: 'web3star.org' },
      { label: 'Twitter/X', href: 'https://x.com/Web3starOrg', display: 'x.com/Web3starOrg' },
      { label: 'Email', href: 'mailto:support@web3star.org', display: 'support@web3star.org' },
    ],
  },
] as const;

function WhitepaperDocument() {
  return (
    <section
      id="whitepaper"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-400">Official document</p>
        <h2 className="mt-1.5 text-xl font-bold text-white md:text-2xl">Web3Star Whitepaper</h2>
        <p className="mt-1.5 max-w-3xl text-left text-xs leading-snug text-gray-400 md:text-sm">
          Full text below. Informational only — development scope and schedule may change.
        </p>
      </div>

      <div className="px-4 py-4 md:px-6 md:py-5">
        <div className="w-full space-y-2">
          {whitepaperSections.map((sec) => (
            <article
              key={sec.n}
              className="relative overflow-hidden rounded-xl border border-gray-800 bg-[#0c0c0c] p-3.5 shadow-[0_0_24px_rgba(6,182,212,0.04)] md:p-4 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-cyan-400/60 before:via-sky-500/35 before:to-blue-600/25"
            >
              <h3 className="pr-2 text-left text-sm font-semibold leading-snug text-white md:text-base">
                <span className="tabular-nums text-cyan-400/95">{sec.n}.</span> {sec.title}
              </h3>

              {'paragraphs' in sec &&
                sec.paragraphs?.map((p, i) => (
                  <p
                    key={`${sec.n}-p-${i}`}
                    className="mt-2 text-left text-sm leading-relaxed text-gray-300"
                  >
                    {p}
                  </p>
                ))}

              {'lines' in sec && sec.lines && (
                <ul className="mt-2 space-y-1 border-l border-cyan-500/15 pl-3 text-left">
                  {sec.lines.map((line) => (
                    <li key={line} className="text-sm leading-relaxed text-gray-300">
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              {'bullets' in sec &&
                sec.bullets?.map((b) => (
                  <div key={b} className="mt-2 flex gap-2 text-left text-sm leading-relaxed text-gray-300">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400/55" aria-hidden />
                    <span>{b}</span>
                  </div>
                ))}

              {'contacts' in sec &&
                sec.contacts && (
                  <ul className="mt-3 space-y-2 text-left">
                    {sec.contacts.map((c) => (
                      <li key={c.label} className="flex flex-wrap items-baseline gap-x-2 text-sm text-gray-300">
                        <span className="min-w-[5.5rem] font-medium text-cyan-400/85">{c.label}</span>
                        {c.href.startsWith('mailto:') ? (
                          <a
                            href={c.href}
                            className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 transition-colors hover:text-cyan-200"
                          >
                            {c.display}
                          </a>
                        ) : (
                          <a
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 transition-colors hover:text-cyan-200"
                          >
                            {c.display}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="border-b border-gray-800/80 px-4 py-6 md:px-8 md:py-7">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-400">Why Web3Star</p>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Benefits</h2>
        <p className="mt-2 max-w-2xl text-sm leading-snug text-gray-400">
          How the platform is designed for creators, miners, and long-term community ownership.
        </p>
      </div>
      <div className="px-4 py-6 md:px-8 md:py-7">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefitCards.map((card) => (
            <article
              key={card.title}
              className="relative overflow-hidden rounded-xl border border-gray-800 bg-[#0c0c0c] p-5 shadow-[0_0_24px_rgba(6,182,212,0.04)] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-cyan-400/70 before:via-sky-500/40 before:to-blue-600/30"
            >
              <div className="flex items-start gap-3 pl-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-300">
                  <card.Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug text-white md:text-base">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400 md:text-sm">{card.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  const wrapRef = React.useRef<HTMLElement>(null);
  const rafRef = React.useRef(0);
  const pendingRef = React.useRef({ xPct: 50, yPct: 45, px: 0, py: 0 });
  const [spotlight, setSpotlight] = React.useState({ xPct: 50, yPct: 45 });
  const [parallax, setParallax] = React.useState({ px: 0, py: 0 });

  const flush = React.useCallback(() => {
    rafRef.current = 0;
    const p = pendingRef.current;
    setSpotlight({ xPct: p.xPct, yPct: p.yPct });
    setParallax({ px: p.px, py: p.py });
  }, []);

  const onHeroMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = wrapRef.current;
      if (!el) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      const r = el.getBoundingClientRect();
      const xPct = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100;
      const yPct = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100;
      const nx = (e.clientX - r.left - r.width / 2) / Math.max(r.width / 2, 1);
      const ny = (e.clientY - r.top - r.height / 2) / Math.max(r.height / 2, 1);
      pendingRef.current = {
        xPct,
        yPct,
        px: Math.max(-1, Math.min(1, nx)),
        py: Math.max(-1, Math.min(1, ny)),
      };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const onHeroLeave = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    pendingRef.current = { xPct: 50, yPct: 45, px: 0, py: 0 };
    setSpotlight({ xPct: 50, yPct: 45 });
    setParallax({ px: 0, py: 0 });
  }, []);

  React.useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const { px, py } = parallax;
  const dx = (m: number) => px * m;
  const dy = (m: number) => py * m;
  const tilt = {
    transform: `perspective(1400px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translate3d(${dx(2)}px, ${dy(2)}px, 0)`,
  };

  return (
    <section
      ref={wrapRef}
      onMouseMove={onHeroMove}
      onMouseLeave={onHeroLeave}
      className="relative scroll-mt-24 overflow-hidden border-b border-white/[0.06]"
    >
      <div className="web3star-hero-mesh" aria-hidden />
      <div className="web3star-hero-grain" aria-hidden />
      <div className="web3star-hero-grid" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light transition-[background] duration-300 ease-out"
        style={{
          background: `radial-gradient(760px circle at ${spotlight.xPct}% ${spotlight.yPct}%, rgba(255,255,255,0.095), rgba(255,255,255,0.025) 28%, transparent 58%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-55 transition-[background] duration-300 ease-out"
        style={{
          background: `radial-gradient(520px circle at ${spotlight.xPct}% ${spotlight.yPct}%, rgba(34,211,238,0.07), transparent 55%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-10 md:px-10 md:pt-12 md:pb-14">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-4">
            <div
              className="mb-5 h-px w-14 bg-gradient-to-r from-cyan-400/70 via-cyan-400/30 to-transparent"
              aria-hidden
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-cyan-400/75 md:text-[11px]">
              Web3 creation
            </p>
            <h1 className="mt-4 overflow-visible text-4xl leading-[1.2] text-white md:text-5xl md:leading-[1.22]">
              <span className="block bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text py-px text-transparent font-medium tracking-[0.026em] md:tracking-[0.05em]">
                Creator-first
              </span>
              <span className="mt-1 block bg-gradient-to-b from-cyan-100 via-cyan-200/90 to-cyan-600/80 bg-clip-text py-px pb-[0.2em] text-transparent font-normal tracking-[0.016em] md:tracking-[0.03em]">
                digital economy
              </span>
            </h1>
            <p className="mt-4 font-serif text-base italic leading-relaxed text-stone-400/95 md:text-lg">
              Your content, your power, your future.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-500">
              The New Era of Crypto-based Creation. <span className="text-cyan-200">“Web3Star”</span>
            </p>
            <div className="mt-8 flex flex-row flex-wrap items-center gap-4">
              <a
                href={ANDROID_STORE_PLACEHOLDER_HREF}
                aria-label="Download for Android (store link coming soon)"
                title="Google Play — link coming soon"
                className="hero-btn hero-btn-primary inline-flex h-12 min-w-[220px] cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-cyan-200/35 px-8 text-center text-sm font-bold tracking-[0.01em] text-white btn-glow-primary opacity-95"
                onClick={(e) => {
                  if (isTodoStoreHref(ANDROID_STORE_PLACEHOLDER_HREF)) e.preventDefault();
                }}
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                Android
              </a>
              <a
                href={IOS_STORE_PLACEHOLDER_HREF}
                aria-label="Download for iOS (store link coming soon)"
                title="App Store — link coming soon"
                className="hero-btn hero-btn-secondary inline-flex h-12 min-w-[220px] cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/25 px-8 text-center text-sm font-medium tracking-[0.01em] text-slate-100/95 btn-glow-outline hover:border-white/40"
                onClick={(e) => {
                  if (isTodoStoreHref(IOS_STORE_PLACEHOLDER_HREF)) e.preventDefault();
                }}
              >
                <Apple className="h-4 w-4 shrink-0" aria-hidden />
                iOS
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-8">
            <div
              className="relative rounded-[1.65rem] border border-white/[0.12] bg-white/[0.04] p-2 shadow-[0_4px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl transition-transform duration-300 ease-out will-change-transform md:rounded-[1.85rem] md:p-2.5"
              style={tilt}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[1.65rem] border border-cyan-300/18 shadow-[0_0_40px_rgba(34,211,238,0.15),0_0_80px_rgba(59,130,246,0.08)] md:rounded-[1.85rem]" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/35 ring-1 ring-black/40 md:rounded-[1.4rem]">
                <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-blue-600/[0.06]" aria-hidden />

                <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
                  <div
                    className="web3star-hero-parallax absolute -right-6 top-6 h-28 w-40 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-transparent opacity-80 blur-[0.5px] transition-transform duration-500 ease-out will-change-transform md:h-32 md:w-48"
                    style={{ transform: `translate3d(${dx(14)}px, ${dy(10)}px, 0)` }}
                  />
                  <div
                    className="web3star-hero-parallax absolute bottom-10 left-2 h-20 w-32 rounded-lg border border-sky-500/18 bg-sky-500/8 transition-transform duration-500 ease-out will-change-transform md:bottom-14 md:left-5 md:h-24 md:w-36"
                    style={{ transform: `translate3d(${dx(-10)}px, ${dy(-8)}px, 0)` }}
                  />
                  <div
                    className="web3star-hero-parallax absolute left-1/2 top-1/2 h-[120%] w-[120%] opacity-[0.15] transition-transform duration-700 ease-out will-change-transform"
                    style={{
                      transform: `translate3d(calc(-50% + ${dx(6)}px), calc(-50% + ${dy(5)}px), 0) rotate(-8deg)`,
                      background:
                        'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(34,211,238,0.12) 48px, rgba(34,211,238,0.12) 49px)',
                    }}
                  />
                </div>

                <img
                  src={heroImage}
                  alt="Web3Star — crystal W logo, skyline silhouettes, and data visualization; tagline Your Content, Your Power, Your Future"
                  className="web3star-hero-parallax relative z-[1] w-full object-cover object-center transition-transform duration-500 ease-out will-change-transform"
                  style={{ transform: `translate3d(${dx(7)}px, ${dy(5)}px, 0) scale(1.02)` }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />

                <div
                  className="web3star-hero-parallax pointer-events-none absolute inset-0 z-[4] transition-transform duration-500 ease-out will-change-transform"
                  style={{
                    transform: `translate3d(${dx(-4)}px, ${dy(-3)}px, 0)`,
                    background:
                      'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.04) 52%, rgba(255,255,255,0.07) 58%, transparent 70%)',
                  }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 bg-gradient-to-t from-[#030308]/95 via-[#030308]/40 to-transparent md:h-20"
                  aria-hidden
                />
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] tracking-wide text-gray-500 md:text-left">
              Official key visual · Web3Star
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = React.useState(false);
  const [isTermsOpen, setIsTermsOpen] = React.useState(false);

  React.useEffect(() => {
    const hash = (location.hash || '').toLowerCase();
    const isOAuthReturn =
      hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('error=') ||
      hash.includes('error_description=');

    if (isOAuthReturn) {
      navigate('/app/login', { replace: true });
    }
  }, [location.hash, navigate]);

  React.useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('app') !== '1') return;
    toast.message('Mining and full features are in the Web3Star mobile app.', {
      description: 'Use the Download section below to get the app.',
      duration: 6500,
    });
    navigate({ pathname: '/', search: '' }, { replace: true });
  }, [location.search, navigate]);

  React.useEffect(() => {
    const targetId = (location.hash || '').replace('#', '').trim();
    if (!targetId) return;

    let retries = 0;
    const maxRetries = 12;
    const tryScroll = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      retries += 1;
      if (retries < maxRetries) {
        window.setTimeout(tryScroll, 120);
      }
    };

    window.setTimeout(tryScroll, 0);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-black text-white scroll-smooth">
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-xl font-bold leading-none tracking-tight"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-lg bg-black p-1 ring-1 ring-white/10">
              <img
                src={`${import.meta.env.BASE_URL}pwa-icon-192.png`}
                width={192}
                height={192}
                decoding="async"
                alt=""
                className="h-full w-full max-h-full max-w-full object-contain object-center"
              />
            </span>
            <span className="text-white">Web3</span>
            <span className="text-cyan-400">Star</span>
          </a>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-gray-300">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-cyan-400 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/Web3starOrg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow-icon flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 hover:border-cyan-400 hover:text-cyan-400"
              aria-label="Open X"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <button
              type="button"
              className="btn-glow-icon flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-500 hover:border-cyan-500/40 hover:text-cyan-400/80"
              aria-label="Telegram coming soon"
            >
              <Send className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-glow-icon flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-500 hover:border-cyan-500/40 hover:text-cyan-400/80"
              aria-label="Discord coming soon"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="scroll-smooth">
        <HeroSection />

        <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 md:px-8 md:py-14">
          <section className="relative overflow-hidden -mt-2 rounded-3xl border border-white/[0.08] bg-black/20 px-4 py-6 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.04)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_20%_0%,rgba(34,211,238,0.18),transparent_55%)] before:opacity-80 before:content-[''] md:px-6 md:py-7">
            <div className="relative z-10 max-w-3xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-400">Platform Vision</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
                <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-[0.03em]">
                  Web3Star Vision
                </span>
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-300/85 md:text-base">
                <p>Web3Star is a platform where creators are a real driver of the economy.</p>
                <p>
                  Creators can directly connect with fans by issuing their own personal coins (creator tokens) based
                  on content. Advertising revenue is transparently distributed to creators, maximizing creators&apos;
                  rights and profits that have been overlooked on existing platforms.
                </p>
                <p>
                  Web3Star will usher in the era of Web3 where personal dreams and creation become assets of the
                  future.
                </p>
              </div>
            </div>
          </section>

          <ProcessRoadmapTimeline />

          <WhitepaperDocument />

          <TokenomicsSection />
          <BenefitsSection />
          <DownloadSection />
          <CommunitySection />
        </div>
      </main>

      <footer className="mt-20 border-t border-cyan-900/30 bg-[radial-gradient(circle_at_20%_0%,rgba(6,182,212,0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.12),transparent_40%),linear-gradient(180deg,#05060a_0%,#020307_100%)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 pb-12 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-3xl font-bold">
              <span className="text-white">Web3</span>
              <span className="text-cyan-400">Star</span>
            </h3>
            <p className="text-gray-300/90 max-w-xl leading-7">
              The Web3 creation platform where creators become the economic driver. Build, mine,
              and grow your future with transparent rewards and creator-first token utility.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Web3Star ecosystem is expanding globally
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {navItems.map((item) => (
                <li key={`footer-${item.href}`}>
                  <a href={item.href} className="hover:text-cyan-300 transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white tracking-wide">Connect</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <a
                  href="https://x.com/Web3starOrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>Telegram (Coming soon)</li>
              <li>Discord (Coming soon)</li>
              <li>
                <a
                  href="mailto:support@web3star.org"
                  className="hover:text-cyan-300 transition-colors"
                >
                  support@web3star.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-900/20">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Web3Star. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrivacyPolicyOpen(true)}
                className="btn-glow-indigo rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1.5 text-indigo-200 hover:border-indigo-300/45 hover:bg-indigo-500/25"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="btn-glow-soft rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 text-cyan-200 hover:border-cyan-300/45 hover:bg-cyan-500/25"
              >
                Terms of Service
              </button>
              <span className="hidden lg:inline text-gray-600">
                This site is for informational purposes only and does not constitute financial
                advice.
              </span>
            </div>
          </div>
        </div>

        <PrivacyPolicyModal
          isOpen={isPrivacyPolicyOpen}
          onClose={() => setIsPrivacyPolicyOpen(false)}
        />
        <TermsOfServiceModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />
      </footer>
    </div>
  );
}
