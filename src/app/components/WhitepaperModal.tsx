import { useEffect } from 'react';
import { X } from 'lucide-react';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhitepaperModal({ isOpen, onClose }: WhitepaperModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Web3Star Whitepaper</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm leading-relaxed space-y-5">
          <p className="text-gray-500 text-xs">
            Full text below. Informational only — development scope and schedule may change.
          </p>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">1. Abstract</h3>
            <p>
              Web3Star is a decentralized Web3 utility ecosystem designed to make
              cryptocurrency-powered creative platforms accessible to everyone.
            </p>
            <p className="mt-2">
              By combining Web 3.0 social media, DAO governance, and smart contract
              functionality, Web3Star delivers a decentralized economy to billions of mobile
              users worldwide.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">2. Introduction</h3>
            <p>
              Web3Star transforms into a blockchain-powered Web3 creative platform. Through our
              cloud-based mobile mining app, users can earn Web3Star utility tokens without
              specialized skills or expensive hardware.
            </p>
            <p className="mt-2">
              By lowering entry barriers with a social media-driven Web3 creative platform, we
              take the first step toward a more inclusive future for Web 3.0 content creation.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">3. The Web3Star Solution</h3>
            <ul className="list-disc list-inside space-y-1 ml-3">
              <li>Users activate mining sessions by tapping a button every 4 hours.</li>
              <li>All mining operations are securely simulated and managed on our cloud backend.</li>
              <li>This ensures no impact on device performance, battery life, or data usage.</li>
              <li>Free access: The app is free to download and use.</li>
              <li>Anyone with a smartphone can mine Web3Star utility tokens.</li>
              <li>Tokens will be airdropped to users who complete KYC verification after mining points.</li>
              <li>
                Web3 integration: Beyond mining, the app serves as a gateway to token utility,
                social features, and future DAO governance.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">4. Our Vision</h3>
            <p>
              Our long-term vision is to establish Web3Star as the core of a dynamic,
              creator-driven Web3 social ecosystem.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-3 mt-2">
              <li>Web3Star enables decentralized social applications for creators.</li>
              <li>$W3S tokens can be used for in-app transactions.</li>
              <li>
                Community-driven growth allows creators to issue their own tokens, expanding
                networks between creators and fans.
              </li>
              <li>
                Fans can hold creator tokens, evolving into decentralized autonomous organizations (DAOs).
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">5. Tokenomics</h3>
            <ul className="space-y-1">
              <li>Name: Web3Star</li>
              <li>Symbol: $W3S (planned)</li>
              <li>Total Supply: 100,000,000,000 $W3S (100 billion)</li>
              <li>Blockchain: Solana (planned)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">6. Distribution</h3>
            <ul className="space-y-1">
              <li>42% — Mobile mining rewards (42B $W3S)</li>
              <li>18% — Ecosystem &amp; partnerships (18B $W3S)</li>
              <li>15% — Core team (vested, 15B $W3S)</li>
              <li>12% — Community growth (12B $W3S)</li>
              <li>13% — Development reserve (13B $W3S)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">
              7. Halving &amp; Mining Rate Reduction
            </h3>
            <p>
              Mining sessions occur every 4 hours. To reward early adopters, $W3S follows a fixed
              time-based halving schedule that gradually reduces mining rates.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">8. Security</h3>
            <p className="mb-2">
              Security and trust are paramount. Our multi-layered security model protects both the
              network and users.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-3">
              <li>
                Bot prevention: Advanced verification, device fingerprinting, and Captcha systems
                ensure fair mining by real users.
              </li>
              <li>
                Account integrity: Mandatory KYC before mainnet withdrawals prevents duplicate
                accounts and Sybil attacks.
              </li>
              <li>Data security: End-to-end encryption for all user data and communications.</li>
              <li>
                Smart contract audits: $W3S contracts and future protocols are audited by third-party
                security firms.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">9. Contact &amp; Community</h3>
            <p className="mb-2">Join our growing community and stay updated on progress.</p>
            <ul className="space-y-1">
              <li>
                Web:
                {' '}
                <a
                  href="https://web3star.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  web3star.org
                </a>
              </li>
              <li>
                Twitter/X:
                {' '}
                <a
                  href="https://x.com/Web3starOrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  x.com/Web3starOrg
                </a>
              </li>
              <li>
                Email:
                {' '}
                <a
                  href="mailto:support@web3star.org"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  support@web3star.org
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
