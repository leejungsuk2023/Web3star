import { Link } from 'react-router';
import { PrivacyPolicyContent } from '../components/PrivacyPolicyContent';

/**
 * Public page for Play Console & store listings (must work without login).
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-300">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← Web3Star
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
        <h1 className="mb-6 text-3xl font-bold text-white">Privacy Policy</h1>
        <PrivacyPolicyContent />
      </main>
    </div>
  );
}
