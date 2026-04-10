/**
 * Shared privacy policy text for modal and public /privacy page (Play Console URL).
 */
export function PrivacyPolicyContent({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        'text-gray-300 text-sm leading-relaxed space-y-4'
      }
    >
      <p className="text-gray-500 text-xs">Last updated: February 6, 2026</p>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">1. Introduction</h3>
        <p>
          Welcome to Web3Star (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your
          personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use our crypto mining application.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">2. Information We Collect</h3>
        <p className="mb-2">We collect information that you provide directly to us, including:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Email address and password (for account creation)</li>
          <li>Nickname and profile information</li>
          <li>Referral codes and invitation data</li>
          <li>Mining activity and rewards history</li>
          <li>Device information and usage statistics</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">3. How We Use Your Information</h3>
        <p className="mb-2">We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Provide, maintain, and improve our services</li>
          <li>Process your mining rewards and transactions</li>
          <li>Send you technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">4. Data Security</h3>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
          Internet is 100% secure.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">5. Third-Party Services</h3>
        <p>
          Our application may contain advertisements and links to third-party services. We are not responsible for the
          privacy practices of these third parties. We encourage you to read their privacy policies.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">6. Children&apos;s Privacy</h3>
        <p>
          Our services are not intended for users under the age of 18. We do not knowingly collect personal information
          from children under 18. If you are a parent or guardian and believe your child has provided us with personal
          information, please contact us.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">7. Your Rights</h3>
        <p className="mb-2">You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Access and receive a copy of your personal data</li>
          <li>Correct inaccurate or incomplete data</li>
          <li>Request deletion of your personal data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">8. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page and updating the &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold text-base mb-2">9. Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy, please visit:
          <br />
          <a
            href="https://web3star.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            web3star.org
          </a>
        </p>
      </section>
    </div>
  );
}
