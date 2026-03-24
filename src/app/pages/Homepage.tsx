import React from 'react';
import { MessageCircle, Send, Twitter } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
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

const tokenomicsItems = [
  { label: 'Mobile Mining Rewards', value: '40-45%', width: '45%' },
  { label: 'Ecosystem & Partnerships', value: '15-20%', width: '20%' },
  { label: 'Core Team (Vested)', value: '15%', width: '15%' },
  { label: 'Community Growth', value: '10%', width: '10%' },
  { label: 'Development Reserve', value: '7-10%', width: '10%' },
];

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

        <section id="process" className="scroll-mt-24 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl md:text-4xl font-bold">Process / Roadmap</h2>
            <span className="text-gray-400 text-sm">Phase 1 - 6</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roadmapItems.map((item) => (
              <article
                key={item.phase}
                className="rounded-2xl border border-gray-800 bg-[#090909] p-5 hover:border-cyan-500/60 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center">
                    {item.phase}
                  </span>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 leading-6">
                  {item.points.map((point) => (
                    <li key={point}>- {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

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

        <section id="tokenomics" className="scroll-mt-24 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <article className="rounded-3xl border border-gray-800 bg-[#090909] p-6 md:p-8 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Tokenomics</h2>
            <p className="text-gray-400">Name: Web3Star | Symbol: $W3S (planned) | Chain: Solana (planned)</p>
            <div className="space-y-4 pt-2">
              {tokenomicsItems.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="text-cyan-400 font-semibold">{item.value}</span>
                  </div>
                  <div className="h-3.5 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-3xl border border-gray-800 bg-gradient-to-br from-[#0d1117] to-[#070809] p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-3">Distribution Principles</h3>
            <ul className="space-y-2 text-gray-300 leading-7 text-sm">
              <li>- Early contributors are rewarded through mining-focused allocation.</li>
              <li>- Sustainable ecosystem growth via partner and reserve pools.</li>
              <li>- Community ownership expands over time through governance mechanisms.</li>
            </ul>
          </article>
        </section>

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
