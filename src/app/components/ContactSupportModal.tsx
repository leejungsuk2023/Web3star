import { useEffect } from 'react';
import { X, Mail, MessageCircle, Globe } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@web3star.org',
      href: 'mailto:support@web3star.org',
      description: 'We typically respond within 24 hours'
    },
    {
      icon: MessageCircle,
      label: 'Telegram',
      value: 'Coming soon',
      href: undefined,
      description: 'Telegram support is coming soon'
    },
    {
      icon: Globe,
      label: 'Website',
      value: 'web3star.org',
      href: 'https://web3star.org',
      description: 'Visit our help center'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl"></div>

        {/* Content */}
        <div className="relative p-8">
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Contact Support
          </h2>
          <p className="text-sm text-gray-400 mb-8 text-center">
            Get help from our support team
          </p>

          {/* Contact Methods */}
          <div className="space-y-4 mb-8">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const isComingSoon = !method.href;
              const content = (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-6 h-6 ${isComingSoon ? 'text-gray-500' : 'text-cyan-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-400 mb-1">{method.label}</div>
                    <div className={`font-medium mb-1 break-all ${isComingSoon ? 'text-gray-500' : 'text-white'}`}>
                      {method.value}
                    </div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </div>
              );

              return isComingSoon ? (
                <div
                  key={method.label}
                  className="block bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-2xl p-4 border border-gray-800/50 opacity-60 cursor-not-allowed"
                >
                  {content}
                </div>
              ) : (
                <a
                  key={method.label}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-800 hover:border-cyan-500/30 transition-colors"
                >
                  {content}
                </a>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
