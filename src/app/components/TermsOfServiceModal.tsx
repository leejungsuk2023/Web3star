import { useEffect } from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white pr-2">Web3Star Terms of Service</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm leading-relaxed space-y-4">
          <p className="text-gray-500 text-xs">Last updated: March 23, 2026</p>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">1. Purpose</h3>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern the use of Web3Star (&quot;Company&quot;), a global
              Web3-based creation and mining application (&quot;Service&quot;), and define the rights, obligations,
              and responsibilities between the Company and users.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">2. Account Registration</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Users may register through Google account integration.</li>
              <li>
                By registering, users must agree to these Terms and the Privacy Policy. Without agreement, access to
                the Service will be restricted.
              </li>
              <li>
                Users are responsible for managing their account information and must not transfer or share it with
                third parties.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">3. Service Description</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>The Company provides Web3-based content creation, mining, and reward services.</li>
              <li>Users may earn rewards by watching advertisements or participating in designated activities.</li>
              <li>The Service may be updated or modified according to Company policies, with prior notice provided.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">4. User Obligations</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Users must comply with applicable laws and these Terms.</li>
              <li>Users must not exploit advertisements or manipulate the reward system in fraudulent ways.</li>
              <li>Content created or shared within the Service is the sole responsibility of the user.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">5. Company Rights and Obligations</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>The Company strives to provide stable and secure global services.</li>
              <li>
                The Company may restrict or terminate accounts that violate these Terms, engage in illegal activities,
                or abuse the reward system.
              </li>
              <li>
                The Company protects user data in accordance with international data protection regulations (e.g.,
                GDPR, CCPA).
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">6. Point Rewards and Advertisements</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                Rewards are provided in the form of points when users watch advertisements or participate in
                designated activities.
              </li>
              <li>The type, method, and amount of points may vary depending on Company policies.</li>
              <li>The Company is not responsible for the content of third-party advertisements.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">7. Privacy and Data Protection</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>The Company collects, uses, and stores personal data in accordance with the Privacy Policy.</li>
              <li>To provide global services, personal data may be stored and processed in multiple jurisdictions.</li>
              <li>Users consent to the use of their data for service operation and reward distribution.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">8. Limitation of Liability</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                The Company is not liable for service interruptions caused by force majeure, network failures, or
                third-party service issues.
              </li>
              <li>The Company is not responsible for user-generated content or external advertisements.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">9. Amendments</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                The Company may amend these Terms when necessary, and updated Terms will be announced within the
                Service.
              </li>
              <li>Users who do not agree with the amended Terms may discontinue use of the Service.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">10. Governing Law and Dispute Resolution</h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                These Terms are governed by international commercial practices and may be subject to local consumer
                protection laws.
              </li>
              <li>Disputes shall be resolved through competent courts or international arbitration procedures.</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-gray-800">
          <button
            type="button"
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
