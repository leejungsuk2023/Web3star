import React from 'react';
import { MessageCircle, Send, Twitter } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import heroImage from '../../assets/web3star-home-hero.png';
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

/** 도넛 차트용 (합계 100%) — 표기는 기존 레인지와 정합 */
const tokenomicsSegments = [
  {
    label: 'Mobile Mining Rewards',
    pct: 42,
    display: '40–45%',
    color: '#ff6b35',
    detail: 'Primary incentives for miners & early adopters.',
  },
  {
    label: 'Ecosystem & Partnerships',
    pct: 18,
    display: '15–20%',
    color: '#e056fd',
    detail: 'Partners, integrations, and ecosystem grants.',
  },
  {
    label: 'Core Team (Vested)',
    pct: 15,
    display: '15%',
    color: '#a855f7',
    detail: 'Long-term alignment with cliff & vesting.',
  },
  {
    label: 'Community Growth',
    pct: 12,
    display: '10%',
    color: '#ec4899',
    detail: 'Campaigns, airdrops, and community programs.',
  },
  {
    label: 'Development Reserve',
    pct: 13,
    display: '7–10%',
    color: '#fbbf24',
    detail: 'Protocol R&D, security, and infrastructure.',
  },
] as const;

/** 로드맵 도로 중심선 (viewBox 좌표) — 핀 위치는 이 경로 기준으로 샘플링 */
const ROAD_VIEW = { w: 1200, h: 440 };
const ROAD_CENTER_PATH =
  'M 36 238 C 160 238, 210 72, 360 72 C 510 72, 550 292, 700 292 C 850 292, 890 88, 1040 88 C 1140 88, 1168 218, 1184 238';

function buildTokenomicsConicGradient() {
  let acc = 0;
  const parts: string[] = [];
  for (const s of tokenomicsSegments) {
    const start = (acc / 100) * 360;
    acc += s.pct;
    const end = (acc / 100) * 360;
    parts.push(`${s.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
  }
  return `conic-gradient(from -90deg, ${parts.join(', ')})`;
}

function RoadmapPin({ n, gradId }: { n: number; gradId: string }) {
  return (
    <svg width="36" height="46" viewBox="0 0 44 56" className="shrink-0 drop-shadow-[0_4px_12px_rgba(34,211,238,0.25)]" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M22 52c-8-10-14-22-14-30a14 14 0 1 1 28 0c0 8-6 20-14 30z" fill={`url(#${gradId})`} />
      <circle cx="22" cy="20" r="9" fill="#0a0a0f" stroke="rgba(34,211,238,0.5)" strokeWidth="1" />
      <text
        x="22"
        y="24"
        textAnchor="middle"
        fill="#e5e7eb"
        fontSize="11"
        fontWeight="700"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {n}
      </text>
    </svg>
  );
}

function ProcessRoadmapTimeline() {
  const measureRef = React.useRef<SVGPathElement | null>(null);
  const [anchors, setAnchors] = React.useState<{ x: number; y: number }[]>([]);

  React.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    if (!(len > 0)) return;
    const t = [0.06, 0.22, 0.38, 0.54, 0.72, 0.9];
    setAnchors(t.map((frac) => {
      const p = el.getPointAtLength(len * frac);
      return { x: p.x, y: p.y };
    }));
  }, []);

  const { w: vbW, h: vbH } = ROAD_VIEW;

  return (
    <section
      id="process"
      className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.06)]"
    >
      <div className="px-4 md:px-8 pt-8 md:pt-10 pb-2">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Process / Roadmap</h2>
          <span className="text-cyan-400/90 text-sm font-medium tracking-wide">Phase 01 — 06</span>
        </div>
        <p className="mt-3 text-gray-400 text-sm max-w-2xl leading-relaxed">
          From mining app launch to global rollout — aligned on one path.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-10 md:pb-12">
        <div className="hidden lg:block mt-4 overflow-x-auto overflow-y-visible pb-4 -mx-1 px-1 [scrollbar-width:thin]">
        <div
          className="relative w-full min-w-[920px] xl:min-w-0 max-w-[1200px] xl:max-w-none mx-auto"
          style={{ aspectRatio: `${vbW} / ${vbH}` }}
        >
          <svg
            className="absolute inset-0 w-full h-full text-[#16161f]"
            viewBox={`0 0 ${vbW} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <linearGradient id="road-edge-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
                <stop offset="50%" stopColor="rgba(59,130,246,0.1)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0.12)" />
              </linearGradient>
            </defs>
            <path
              d={ROAD_CENTER_PATH}
              fill="none"
              stroke="#1c1c26"
              strokeWidth="48"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={ROAD_CENTER_PATH}
              fill="none"
              stroke="url(#road-edge-glow)"
              strokeWidth="48"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={ROAD_CENTER_PATH}
              fill="none"
              stroke="rgba(34,211,238,0.45)"
              strokeWidth="2"
              strokeDasharray="9 14"
              strokeLinecap="round"
            />
            <path
              ref={measureRef}
              d={ROAD_CENTER_PATH}
              fill="none"
              stroke="transparent"
              strokeWidth="1"
            />
          </svg>

          {anchors.length === roadmapItems.length &&
            roadmapItems.map((item, i) => (
              <div
                key={item.phase}
                className="absolute z-10 flex flex-col items-center w-[148px] xl:w-[168px]"
                style={{
                  left: `${(anchors[i].x / vbW) * 100}%`,
                  top: `${(anchors[i].y / vbH) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="rounded-xl border border-cyan-500/20 bg-black/75 backdrop-blur-sm px-2.5 py-2 shadow-lg shadow-cyan-950/40 mb-1">
                  <p className="text-[10px] font-semibold text-cyan-400/90 tabular-nums">Phase {item.phase}</p>
                  <h3 className="text-center text-[11px] xl:text-xs font-semibold text-white leading-snug mt-0.5">
                    {item.title}
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-[9px] xl:text-[10px] text-gray-400 leading-snug text-left">
                    {item.points.map((p) => (
                      <li key={p} className="pl-2 border-l border-cyan-500/25">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <RoadmapPin n={i + 1} gradId={`roadmap-pin-grad-${item.phase}`} />
              </div>
            ))}
        </div>
        </div>

        <div className="lg:hidden mt-8 relative pl-3">
          <div
            className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/60 via-blue-500/40 to-indigo-600/30"
            aria-hidden
          />
          <ul className="space-y-8">
            {roadmapItems.map((item, i) => (
              <li key={item.phase} className="relative flex gap-4 pl-10">
                <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/35 bg-[#0c0c12] shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                  <span className="text-xs font-bold bg-gradient-to-br from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    {i + 1}
                  </span>
                </div>
                <article className="flex-1 rounded-2xl border border-gray-800 bg-[#0c0c0c] px-4 py-3">
                  <p className="text-xs font-semibold text-cyan-400/90">Phase {item.phase}</p>
                  <h3 className="text-base font-semibold text-white mt-0.5">{item.title}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
                    {item.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="text-cyan-500/50 shrink-0">·</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TokenomicsInfographic() {
  const gradient = buildTokenomicsConicGradient();
  const mid = Math.ceil(tokenomicsSegments.length / 2);
  const leftCol = tokenomicsSegments.slice(0, mid);
  const rightCol = tokenomicsSegments.slice(mid);

  return (
    <section
      id="tokenomics"
      className="scroll-mt-24 relative overflow-hidden rounded-3xl border border-purple-500/20"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0a0518]"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(140%,800px)] h-[min(140%,800px)] rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Tokenomics
        </h2>
        <p className="text-center text-sm text-purple-200/80 mb-10 md:mb-12 max-w-xl mx-auto">
          Name: Web3Star · Symbol: $W3S (planned) · Illustrative allocation (totals 100%)
        </p>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_minmax(260px,320px)_1fr] gap-8 lg:gap-6 items-center">
          <ul className="space-y-6 order-2 lg:order-1 flex flex-col items-end lg:items-end">
            {leftCol.map((s) => (
              <li key={s.label} className="w-full max-w-[260px] text-right">
                <p className="text-base font-semibold" style={{ color: s.color }}>
                  {s.label}
                </p>
                <p className="text-lg font-bold text-white">{s.display}</p>
                <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">{s.detail}</p>
              </li>
            ))}
          </ul>

          <div className="relative flex justify-center order-1 lg:order-2 py-4">
            <div
              className="absolute inset-0 m-auto w-[min(85vw,280px)] h-[min(85vw,280px)] md:w-[300px] md:h-[300px] rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_60px_rgba(236,72,153,0.25)] pointer-events-none scale-110"
              aria-hidden
            />
            <div
              className="absolute right-0 top-1/4 w-24 h-32 rounded-2xl bg-white/[0.07] backdrop-blur-lg border border-white/15 shadow-lg hidden md:block"
              aria-hidden
            />
            <div
              className="absolute right-[-8px] bottom-1/4 w-20 h-24 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 hidden md:block"
              aria-hidden
            />

            <div className="relative w-[min(78vw,260px)] h-[min(78vw,260px)] md:w-[280px] md:h-[280px]">
              <div
                className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(255,107,53,0.35)]"
                style={{
                  background: gradient,
                  maskImage: 'radial-gradient(circle, transparent 56%, black 56.5%)',
                  WebkitMaskImage: 'radial-gradient(circle, transparent 56%, black 56.5%)',
                }}
              />
              <div className="absolute inset-[18%] rounded-full bg-gradient-to-b from-[#1f0f3a]/95 to-[#0d0618] border border-purple-500/30 flex flex-col items-center justify-center text-center px-4 shadow-inner">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-purple-300/90 font-semibold">
                  Allocation
                </p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">100%</p>
                <p className="text-[10px] text-purple-300/70 mt-1">$W3S · planned</p>
              </div>
            </div>
          </div>

          <ul className="space-y-6 order-3">
            {rightCol.map((s) => (
              <li key={s.label}>
                <div className="max-w-[240px]">
                  <p className="text-base font-semibold" style={{ color: s.color }}>
                    {s.label}
                  </p>
                  <p className="text-lg font-bold text-white">{s.display}</p>
                  <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">{s.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-3xl mx-auto mt-12 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 md:p-6">
          <h3 className="text-sm font-semibold text-purple-200 mb-2">Distribution principles</h3>
          <ul className="text-sm text-purple-100/85 space-y-2 leading-relaxed">
            <li>· Early contributors are rewarded through mining-focused allocation.</li>
            <li>· Sustainable ecosystem growth via partner and reserve pools.</li>
            <li>· Community ownership expands over time through governance mechanisms.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const benefitCards = [
  {
    title: 'Creator-first Economy',
    desc: 'Creators issue personal tokens and monetize directly with transparent revenue sharing.',
  },
  {
    title: 'Low Barrier Entry',
    desc: '4-hour cloud mining works on mobile without hardware cost, battery burden, or complexity.',
  },
  {
    title: 'Web3 Utility',
    desc: 'Token utility, social features, and long-term DAO governance are integrated in one ecosystem.',
  },
  {
    title: 'Security by Design',
    desc: 'Bot prevention, KYC before withdrawal, encryption, and smart contract audits.',
  },
];

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

  return (
    <div className="min-h-screen bg-black text-white scroll-smooth">
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="text-xl font-bold tracking-tight">
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
              className="w-9 h-9 rounded-full border border-gray-700 hover:border-cyan-400 hover:text-cyan-400 flex items-center justify-center transition-colors"
              aria-label="Open X"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-gray-700 text-gray-500 flex items-center justify-center"
              aria-label="Telegram coming soon"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-gray-700 text-gray-500 flex items-center justify-center"
              aria-label="Discord coming soon"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-16">
        <section className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-center scroll-mt-24">
          <div className="space-y-5">
            <p className="text-cyan-400 text-xs tracking-[0.35em] uppercase">The New Era of Web3 Creation</p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
              Your Dream,
              <br />
              Your Contents,
              <br />
              Your Future.
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl">
              Web3Star is building a creator-first crypto platform where content, community, and
              token utility become a real digital economy.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/app/login"
                className="px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-colors"
              >
                Start with Web3Star
              </Link>
              <a
                href="#whitepaper"
                className="px-5 py-3 rounded-full border border-gray-700 text-gray-200 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
              >
                Read Whitepaper
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-[#0c0c0c] to-[#060606] p-2 shadow-2xl shadow-cyan-500/10">
            <img src={heroImage} alt="Web3Star hero banner" className="w-full h-auto rounded-2xl object-contain" />
          </div>
        </section>

        <ProcessRoadmapTimeline />

        <section id="whitepaper" className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] p-6 md:p-8 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Whitepaper</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300 leading-7">
            <div className="space-y-3">
              <p><strong>Abstract:</strong> A decentralized utility ecosystem designed for mass creator adoption.</p>
              <p><strong>Solution:</strong> 4-hour cloud mining sessions and token utility with low entry barriers.</p>
              <p><strong>Vision:</strong> Creator tokens, fan economies, and community-driven governance.</p>
              <p><strong>Security:</strong> Anti-bot systems, KYC checks, encryption, and external audits.</p>
            </div>
            <div className="space-y-3">
              <p><strong>KR 비전:</strong> 창작자가 경제의 주체가 되고 광고 수익을 투명하게 배분받는 구조.</p>
              <p><strong>EN Vision:</strong> Creator rights and profits are maximized through direct fan connection.</p>
              <p><strong>Token:</strong> Web3Star ($W3S, planned), supply 100,000,000,000.</p>
              <p className="text-sm text-gray-500">
                This document is informational only and development schedule may change.
              </p>
            </div>
          </div>
        </section>

        <TokenomicsInfographic />

        <section id="benefits" className="scroll-mt-24 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Benefits</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {benefitCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-800 bg-[#090909] p-5">
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-gray-300 leading-6">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="download" className="scroll-mt-24 grid md:grid-cols-2 gap-6">
          <article className="rounded-3xl border border-gray-800 bg-[#090909] p-6 md:p-8 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Download</h2>
            <p className="text-gray-300">Install Web3Star and start mining in three steps:</p>
            <ol className="space-y-2 text-gray-300">
              <li>1. Download Android app package</li>
              <li>2. Sign up and add referral code (optional)</li>
              <li>3. Activate mining every 4 hours and complete KYC</li>
            </ol>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                className="px-5 py-3 rounded-full bg-cyan-500/70 text-black/90 font-semibold cursor-not-allowed"
                title="Google Play release coming soon"
              >
                Android Download
              </button>
              <button
                type="button"
                className="px-5 py-3 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 font-semibold cursor-not-allowed"
                title="App Store release coming soon"
              >
                iOS Download
              </button>
              <a href="#process" className="px-5 py-3 rounded-full border border-gray-700 text-gray-200 hover:border-cyan-400 hover:text-cyan-400 transition-colors">
                Installation Guide
              </a>
            </div>
          </article>

          <article id="community" className="scroll-mt-24 rounded-3xl border border-gray-800 bg-[#090909] p-6 md:p-8 space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold">Community</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                Web:{' '}
                <a href="https://web3star.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
                  web3star.org
                </a>
              </p>
              <p>
                X (Twitter):{' '}
                <a href="https://x.com/Web3starOrg" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
                  x.com/Web3starOrg
                </a>
              </p>
              <p>Email: support@web3star.org</p>
              <p>Telegram: Coming soon</p>
              <p>Discord: Coming soon</p>
            </div>
          </article>
        </section>
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
                className="px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/25 hover:border-indigo-300/40 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-300/40 transition-colors"
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
