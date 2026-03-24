import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import GetMorePointModal from '../components/GetMorePointModal';
import miningCenterLogo from '../../assets/mining-center-logo.png';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { showInterstitialAd, showRewardedAd, preloadInterstitialAd } from '../../lib/admob';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const MINING_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const MINING_REWARD = 10;
const AD_REWARD_PER_SLOT = 5;
const AD_BONUS_ALL_SLOTS = 5;
const AD_COOLDOWN_SECONDS = 10;

function getTimeRemaining(lastMinedAt: string | null): { hours: number; minutes: number; seconds: number } {
  if (!lastMinedAt) return { hours: 0, minutes: 0, seconds: 0 };

  const elapsed = Date.now() - new Date(lastMinedAt).getTime();
  const remaining = MINING_COOLDOWN_MS - elapsed;

  if (remaining <= 0) return { hours: 0, minutes: 0, seconds: 0 };

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Home() {
  const { user, profile, refreshProfile } = useAuth();
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlots, setActiveSlots] = useState<number[]>([]);
  const [centerButtonActive, setCenterButtonActive] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [adCooldown, setAdCooldown] = useState(0); // seconds remaining between ads

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      const remaining = getTimeRemaining(profile.last_mined_at);
      setTime(remaining);

      if (profile.last_mined_at) {
        const elapsed = Date.now() - new Date(profile.last_mined_at).getTime();
        setCenterButtonActive(elapsed < MINING_COOLDOWN_MS);
      }

      const slots = profile.ad_slots_viewed;
      if (Array.isArray(slots)) {
        setActiveSlots(slots);
      }
    }
  }, [profile]);

  // Mining cycle timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (profile?.last_mined_at) {
        const remaining = getTimeRemaining(profile.last_mined_at);
        setTime(remaining);

        if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
          setCenterButtonActive(false);
          // 쿨다운 끝 → W 버튼 활성화 → 광고 미리 로딩
          preloadInterstitialAd();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile?.last_mined_at]);

  // 앱 시작 시 W 버튼이 이미 활성화 상태라면 바로 광고 미리 로딩
  useEffect(() => {
    if (profile && !centerButtonActive) {
      const elapsed = profile.last_mined_at
        ? Date.now() - new Date(profile.last_mined_at).getTime()
        : MINING_COOLDOWN_MS + 1;
      if (elapsed >= MINING_COOLDOWN_MS) {
        preloadInterstitialAd();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]); // 프로필 첫 로딩 시 한 번만

  // Ad cooldown countdown
  useEffect(() => {
    if (adCooldown <= 0) return;
    const t = setTimeout(() => setAdCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [adCooldown]);

  const formatTime = (value: number) => String(value).padStart(2, '0');

  // 채굴 완료 4시간 뒤 로컬 알림 예약
  const scheduleMiningNotification = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      // 기존 채굴 알림 취소 후 재예약
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: '⛏️ Web3Star — Mining ready',
            body: 'Your 4-hour cooldown has ended. Open the app and mine to earn PTS!',
            schedule: { at: new Date(Date.now() + MINING_COOLDOWN_MS) },
            sound: undefined,
            smallIcon: 'ic_stat_icon_config_sample',
          },
        ],
      });
    } catch (e) {
      console.warn('Local notification scheduling failed:', e);
    }
  }, []);

  // Mine: always exactly MINING_REWARD (10) points, no ad bonus
  const handleMine = useCallback(async () => {
    if (!user || isMining || centerButtonActive) return;
    setIsMining(true);

    const now = new Date().toISOString();

    const { data: freshUser } = await supabase
      .from('users')
      .select('point')
      .eq('id', user.id)
      .single();

    const currentPoint = freshUser?.point ?? profile?.point ?? 0;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        point: currentPoint + MINING_REWARD,
        last_mined_at: now,
        ad_slots_viewed: [], // reset ad slots for new cycle
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Mining failed:', updateError);
      toast.error('Mining failed. Please try again.');
      setIsMining(false);
      return;
    }

    await supabase.from('mining_logs').insert({
      user_id: user.id,
      amount: MINING_REWARD,
      type: 'MINING',
    });

    setCenterButtonActive(true);
    setActiveSlots([]);
    setAdCooldown(0);
    await refreshProfile();
    toast.success(`+${MINING_REWARD} PTS — Mining complete!`);
    // 4시간 뒤 알림 예약
    await scheduleMiningNotification();
    setIsMining(false);
  }, [user, isMining, centerButtonActive, profile, refreshProfile, scheduleMiningNotification]);

  // Ad watched: award PTS on Rewarded. Returns true if 10s cooldown should start after ad is dismissed (X).
  const handleWatchAd = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setIsModalOpen(false);

    if (activeSlots.length >= 5) return false;

    const nextSlot = [1, 2, 3, 4, 5].find(s => !activeSlots.includes(s));
    if (!nextSlot) return false;

    const newSlots = [...activeSlots, nextSlot];
    const isComplete = newSlots.length === 5;
    const reward = AD_REWARD_PER_SLOT + (isComplete ? AD_BONUS_ALL_SLOTS : 0);

    // Fetch fresh points to avoid stale values
    const { data: freshUser } = await supabase
      .from('users')
      .select('point')
      .eq('id', user.id)
      .single();

    const currentPoint = freshUser?.point ?? profile?.point ?? 0;

    const { error: slotError } = await supabase
      .from('users')
      .update({
        ad_slots_viewed: newSlots,
        point: currentPoint + reward,
      })
      .eq('id', user.id);

    if (slotError) {
      console.error('Failed to save ad slot:', slotError);
      toast.error('Failed to save progress.');
      return false;
    }

    setActiveSlots(newSlots);

    await supabase.from('mining_logs').insert({
      user_id: user.id,
      amount: reward,
      type: 'AD_POINT',
      slot_number: nextSlot,
    });

    await refreshProfile();

    if (isComplete) {
      toast.success(`+${AD_REWARD_PER_SLOT} PTS + Bonus +${AD_BONUS_ALL_SLOTS} PTS! 🎉 Completed all 5 ads!`);
      return false;
    }
    toast.success(`+${AD_REWARD_PER_SLOT} PTS Ad reward! (${newSlots.length}/5)`);
    return true;
  }, [user, activeSlots, profile, refreshProfile]);

  // 항상 최신 handleMine을 참조하도록 ref 유지 (stale closure 방지)
  const handleMineRef = useRef(handleMine);
  useEffect(() => {
    handleMineRef.current = handleMine;
  }, [handleMine]);

  const handleCenterButtonClick = useCallback(() => {
    if (centerButtonActive || isMining) return;
    showInterstitialAd(async () => {
      await handleMineRef.current();
    }).catch((e) => {
      console.warn('Ad failed, mining anyway:', e);
      handleMineRef.current();
    });
  }, [centerButtonActive, isMining]);

  const handleSlotClick = () => {
    if (activeSlots.length < 5 && adCooldown === 0) {
      setIsModalOpen(true);
    }
  };

  const getSlotColor = (slot: number) => {
    const isActive = activeSlots.includes(slot);
    if (isActive) {
      const intensity = activeSlots.length / 5;
      if (intensity >= 0.8) return 'bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-cyan-300 shadow-lg shadow-cyan-400/60';
      if (intensity >= 0.6) return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50';
      return 'bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-500 shadow-lg shadow-cyan-500/40';
    }
    if (adCooldown > 0) return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 opacity-50 cursor-not-allowed';
    return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-cyan-500/50 cursor-pointer';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Center Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Glowing Circular Button */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-3xl scale-125 animate-pulse transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-30' : 'opacity-10'
          }`}></div>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-2xl scale-110 transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-20' : 'opacity-5'
          }`}></div>

          <button
            onClick={handleCenterButtonClick}
            disabled={centerButtonActive || isMining}
            aria-label={centerButtonActive ? 'Mining in progress' : 'Start Mining'}
            className={`relative w-56 h-56 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              centerButtonActive
                ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-blue-500/50 hover:scale-105 active:scale-95'
                : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-gray-800/30 hover:scale-102 cursor-pointer'
            } overflow-hidden`}
          >
            <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_50%_45%,#091a2b_0%,#040912_55%,#02050a_100%)]"></div>
            <div className="relative z-10 w-40 h-40 rounded-full overflow-hidden bg-transparent">
              <img
                src={miningCenterLogo}
                alt="Web3Star mining logo"
                className={`absolute top-1/2 left-1/2 w-[75%] h-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full object-contain bg-[#000] transition-all duration-300 ${
                  centerButtonActive
                    ? 'saturate-125 contrast-120 brightness-110 drop-shadow-[0_0_24px_rgba(56,189,248,0.75)]'
                    : 'saturate-115 contrast-110 brightness-105 drop-shadow-[0_0_12px_rgba(148,163,184,0.3)]'
                }`}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_62%,rgba(2,5,10,0.5)_80%,rgba(2,5,10,0.86)_100%)]" />
            </div>
            <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 ${
              centerButtonActive ? 'border-white/20' : 'border-gray-700/50'
            }`}></div>
          </button>
        </div>

        {/* Countdown Timer */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tracking-wider bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
          </div>
          <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Next Mining Cycle</div>
        </div>
      </div>

      {/* Bottom Section - Ad Slots */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-gray-400 font-medium">Get More Points</span>
              <span className="text-xs text-gray-600 ml-2">Watch 1 ad = +5 PTS</span>
            </div>
            <div className="flex items-center gap-2">
              {adCooldown > 0 && (
                <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                  {adCooldown}s
                </span>
              )}
              <span className="text-xs text-cyan-400">{activeSlots.length}/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {[1, 2, 3, 4, 5].map((slot) => (
              <button
                key={slot}
                onClick={handleSlotClick}
                disabled={activeSlots.includes(slot) || adCooldown > 0}
                aria-label={`Ad slot ${slot}${activeSlots.includes(slot) ? ' (watched)' : adCooldown > 0 ? ' (cooldown)' : ''}`}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${getSlotColor(slot)}`}
              >
                <Zap
                  className={`w-5 h-5 transition-colors ${
                    activeSlots.includes(slot)
                      ? 'text-white fill-white'
                      : adCooldown > 0
                      ? 'text-gray-600'
                      : 'text-gray-600 group-hover:text-cyan-500'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Bonus info */}
          {activeSlots.length < 5 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-600">
                Bonus <span className="text-cyan-500">+5 PTS</span> for watching all 5 ads
              </span>
            </div>
          )}
          {activeSlots.length === 5 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-cyan-400 font-medium">All 5 ads completed! Total +30 PTS</span>
            </div>
          )}

          {/* Cooldown message */}
          {adCooldown > 0 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-amber-400">
                Wait <span className="font-mono font-bold">{adCooldown}s</span> until the next ad
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 광고 슬롯 모달 (하단 번개 버튼용) */}
      <GetMorePointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWatchAd={async () => {
          setIsModalOpen(false);
          let startCooldownAfterDismiss = false;
          await showRewardedAd(
            async () => {
              startCooldownAfterDismiss = await handleWatchAd();
            },
            async () => {
              if (startCooldownAfterDismiss) {
                setAdCooldown(AD_COOLDOWN_SECONDS);
              }
            }
          );
        }}
        triggerSource="slot"
      />
    </div>
  );
}
