import type { LucideIcon } from 'lucide-react';
import { Copy, ClipboardCheck, History, FileText, Lock, Mail, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import ComingSoonModal from '../components/ComingSoonModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import ContactSupportModal from '../components/ContactSupportModal';
import ActivityHistoryModal from '../components/ActivityHistoryModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);

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
      setIsComingSoonOpen(true);
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-white text-xl font-bold mb-1">{profile?.nickname ?? 'User'}</h2>
          <p className="text-gray-400 text-sm mb-2">{profile?.email ?? ''}</p>
          <p className="text-gray-500 text-xs mb-3">Joined {formatDate(profile?.created_at)}</p>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 rounded-full">
            <span className="text-sm font-medium">Level 1 Miner</span>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6 border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-3">Referral Code</h3>
          <div className="flex items-center justify-between bg-[#0a0a0a] rounded-lg px-4 py-3 border border-gray-800">
            <span className="text-lg font-mono tracking-wider">{referralCode}</span>
            <button
              onClick={handleCopy}
              className="ml-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Copy referral code"
            >
              {copied ? (
                <ClipboardCheck className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800">
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
                className={`w-full flex items-center px-5 py-4 transition-colors ${
                  item.comingSoon
                    ? 'cursor-default opacity-75'
                    : 'hover:bg-[#252525]'
                } ${index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''}`}
              >
                <Icon className={`w-5 h-5 mr-4 flex-shrink-0 ${item.danger ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`flex-1 text-left ${item.danger ? 'text-red-500' : 'text-gray-200'}`}>
                  {item.label}
                </span>
                {item.comingSoon && (
                  <span className="text-xs text-gray-500 font-medium">Coming soon</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modals */}
        <ComingSoonModal
          isOpen={isComingSoonOpen}
          onClose={() => setIsComingSoonOpen(false)}
        />
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
      </div>
    </div>
  );
}
