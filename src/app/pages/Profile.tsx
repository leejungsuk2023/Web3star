import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Copy, ClipboardCheck, History, FileText, Lock, Mail, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import ContactSupportModal from '../components/ContactSupportModal';
import ActivityHistoryModal from '../components/ActivityHistoryModal';
import WhitepaperModal from '../components/WhitepaperModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);

  const referralCode = profile?.invite_code ?? '------';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = referralCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/app/login');
  };

  const handleMenuClick = (label: string) => {
    if (label === 'White Paper') {
      setIsWhitepaperOpen(true);
    } else if (label === 'Privacy Policy') {
      setIsPrivacyPolicyOpen(true);
    } else if (label === 'Activity History') {
      setIsActivityHistoryOpen(true);
    } else if (label === 'Contact Support') {
      setIsContactSupportOpen(true);
    } else if (label === 'Log Out') {
      handleLogout();
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const menuItems: {
    icon: LucideIcon;
    label: string;
    danger?: boolean;
    comingSoon?: boolean;
  }[] = [
    { icon: History, label: 'Activity History' },
    { icon: FileText, label: 'White Paper' },
    { icon: Lock, label: 'Privacy Policy' },
    { icon: Mail, label: 'Contact Support' },
    { icon: Shield, label: 'KYC', comingSoon: true },
    { icon: LogOut, label: 'Log Out', danger: true },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-28 pt-2 [-webkit-overflow-scrolling:touch] sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex flex-col items-center">
          <h2 className="mb-0.5 text-xl font-bold text-zinc-100">{profile?.nickname ?? 'User'}</h2>
          <p className="mb-1.5 text-sm text-zinc-400">{profile?.email ?? ''}</p>
          <p className="mb-2 text-xs text-zinc-500">Joined {formatDate(profile?.created_at)}</p>
          <div className="rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-3 py-1 shadow-lg shadow-purple-500/20">
            <span className="text-xs font-medium text-white">Level 1 Miner</span>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900/50 to-gray-800/50 p-4 backdrop-blur-sm">
          <h3 className="mb-2 text-sm font-medium text-zinc-400">Referral Code</h3>
          <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-black/35 px-4 py-3">
            <span className="text-lg font-mono tracking-wider text-zinc-100">{referralCode}</span>
            <button
              onClick={handleCopy}
              className="ml-4 rounded-lg p-2 transition-colors hover:bg-zinc-800/80"
              aria-label="Copy referral code"
            >
              {copied ? (
                <ClipboardCheck className="h-5 w-5 text-cyan-400" />
              ) : (
                <Copy className="h-5 w-5 text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.comingSoon) return;
                  handleMenuClick(item.label);
                }}
                disabled={item.comingSoon}
                className={`flex w-full items-center px-5 py-3.5 transition-colors ${
                  item.comingSoon
                    ? 'cursor-default opacity-75'
                    : 'hover:bg-white/[0.04]'
                } ${index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''}`}
              >
                <Icon
                  className={`mr-4 h-5 w-5 shrink-0 ${item.danger ? 'text-red-400' : 'text-zinc-400'}`}
                />
                <span className={`flex-1 text-left ${item.danger ? 'text-red-400' : 'text-zinc-200'}`}>
                  {item.label}
                </span>
                {item.comingSoon && (
                  <span className="text-xs font-medium text-zinc-500">Coming soon</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modals */}
        <PrivacyPolicyModal
          isOpen={isPrivacyPolicyOpen}
          onClose={() => setIsPrivacyPolicyOpen(false)}
        />
        <ContactSupportModal
          isOpen={isContactSupportOpen}
          onClose={() => setIsContactSupportOpen(false)}
        />
        <ActivityHistoryModal
          isOpen={isActivityHistoryOpen}
          onClose={() => setIsActivityHistoryOpen(false)}
        />
        <WhitepaperModal
          isOpen={isWhitepaperOpen}
          onClose={() => setIsWhitepaperOpen(false)}
        />
      </div>
    </div>
  );
}
