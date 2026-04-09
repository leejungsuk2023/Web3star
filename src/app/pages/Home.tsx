import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Timer, Zap } from 'lucide-react';
import { toast } from 'sonner';
import GetMorePointModal from '../components/GetMorePointModal';
import miningCenterLogo from '../../assets/mining-center-logo.png';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { showInterstitialAd, showRewardedAd, preloadInterstitialAd } from '../../lib/admob';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  MINING_COOLDOWN_MS,
  canOpenRewardedAdSlotModal,
  effectiveAdSlotsViewed,
} from '../../lib/miningAdSlots';
const MINING_REWARD = 10;
const AD_REWARD_PER_SLOT = 5;
const AD_BONUS_ALL_SLOTS = 5;
const AD_COOLDOWN_SECONDS = 10;
const AD_COOLDOWN_TICK_MS = 200;

function adCooldownSecondsRemaining(endsAtMs: number | null): number {
  if (endsAtMs == null) return 0;
  const ms = endsAtMs - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 1000);
}

const MINING_NOTIFICATION_ID = 1001;
const MINING_NOTIFICATION_CHANNEL_ID = 'mining-reminders-v1';

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
  /** Wall-clock end of inter-slot ad cooldown (avoids setTimeout drift on some devices). */
  const [adCooldownEndsAt, setAdCooldownEndsAt] = useState<number | null>(null);
  const [, setAdCooldownPulse] = useState(0);
  const adCooldown = adCooldownSecondsRemaining(adCooldownEndsAt);
  const [isInterstitialInFlight, setIsInterstitialInFlight] = useState(false);

  const miningBlocked = Boolean(profile?.mining_disabled);

  // Ads 동시 show 방지용 in-flight 락 (사용자가 연타할 때 중복 호출되는 걸 막음)
  const interstitialInFlightRef = useRef(false);
  const rewardedInFlightRef = useRef(false);
  const exactAlarmPromptedRef = useRef(false);
  /** Avoid spamming the system permission dialog when schedule runs often (ads, resume). */
  const notificationPermissionPromptedRef = useRef(false);
  /** Show the settings nudge at most once per app session if permission stays denied. */
  const miningNotifPermissionToastShownRef = useRef(false);

  // Prompt notification permission early on Home entry (once) so users don't see delayed popup later.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user?.id) return;
    if (notificationPermissionPromptedRef.current) return;
    let cancelled = false;

    void (async () => {
      let { display } = await LocalNotifications.checkPermissions();
      if (cancelled || display === 'granted') return;
      notificationPermissionPromptedRef.current = true;
      await LocalNotifications.requestPermissions();
      ({ display } = await LocalNotifications.checkPermissions());
      if (cancelled || display === 'granted') return;
      if (!miningNotifPermissionToastShownRef.current) {
        miningNotifPermissionToastShownRef.current = true;
        toast.warning('Enable notifications in system settings to get 4-hour mining reminders.', {
          id: 'web3star-mining-notif-permission',
          duration: 6000,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** 관리자 채굴 차단 시 예약된 채굴 알림 취소 */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!miningBlocked) return;
    void LocalNotifications.cancel({ notifications: [{ id: MINING_NOTIFICATION_ID }] });
  }, [miningBlocked]);

  useEffect(() => {
    if (miningBlocked && isModalOpen) setIsModalOpen(false);
  }, [miningBlocked, isModalOpen]);

  // Initialize state from profile — rewarded slots only count during post-mine cooldown (after logo tap).
  useEffect(() => {
    if (profile) {
      const remaining = getTimeRemaining(profile.last_mined_at);
      setTime(remaining);

      const inCooldown = (() => {
        if (!profile.last_mined_at) return false;
        const elapsed = Date.now() - new Date(profile.last_mined_at).getTime();
        return elapsed < MINING_COOLDOWN_MS;
      })();
      setCenterButtonActive(inCooldown);

      setActiveSlots(effectiveAdSlotsViewed(profile.last_mined_at, profile.ad_slots_viewed));
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
          setActiveSlots([]);
          // 쿨다운 끝 → 로고(채굴) 전까지 하단 리워드 슬롯 잠금 → 광고 미리 로딩
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

  // Ad cooldown: re-render from Date.now() vs deadline (no chained 1s timers).
  useEffect(() => {
    if (adCooldownEndsAt == null) return;
    const id = window.setInterval(() => {
      if (Date.now() >= adCooldownEndsAt) {
        setAdCooldownEndsAt(null);
      }
      setAdCooldownPulse((x) => x + 1);
    }, AD_COOLDOWN_TICK_MS);
    return () => window.clearInterval(id);
  }, [adCooldownEndsAt]);

  const formatTime = (value: number) => String(value).padStart(2, '0');

  // 채굴 리마인더 알림 예약(남은 시간 기준)
  const scheduleMiningNotification = useCallback(async (triggerAt: Date) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Ensure Android notifications use a stable high-importance channel.
      await LocalNotifications.createChannel({
        id: MINING_NOTIFICATION_CHANNEL_ID,
        name: 'Mining Reminders',
        description: '4-hour mining cooldown reminders',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      let { display } = await LocalNotifications.checkPermissions();
      if (display !== 'granted' && !notificationPermissionPromptedRef.current) {
        notificationPermissionPromptedRef.current = true;
        await LocalNotifications.requestPermissions();
        ({ display } = await LocalNotifications.checkPermissions());
      }
      if (display !== 'granted') {
        if (!miningNotifPermissionToastShownRef.current) {
          miningNotifPermissionToastShownRef.current = true;
          toast.warning('Enable notifications in system settings to get 4-hour mining reminders.', {
            id: 'web3star-mining-notif-permission',
            duration: 6000,
          });
        }
        return;
      }

      // Android 12+ exact alarm setting can differ by device/vendor.
      // Prompt once per app run if exact alarms are disabled.
      const exact = await LocalNotifications.checkExactNotificationSetting();
      if (exact.exact_alarm !== 'granted' && !exactAlarmPromptedRef.current) {
        exactAlarmPromptedRef.current = true;
        try {
          await LocalNotifications.changeExactNotificationSetting();
        } catch {
          // Ignore setting redirect failures and continue with best effort schedule.
        }
      }

      // 기존 채굴 알림 취소 후 재예약
      await LocalNotifications.cancel({ notifications: [{ id: MINING_NOTIFICATION_ID }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: MINING_NOTIFICATION_ID,
            title: '⛏️ Web3Star — Mining ready',
            body: 'Your 4-hour cooldown has ended. Open the app and mine to earn PTS!',
            schedule: {
              at: triggerAt,
              allowWhileIdle: true,
            },
            sound: undefined,
            smallIcon: 'ic_stat_icon_config_sample',
            channelId: MINING_NOTIFICATION_CHANNEL_ID,
          },
        ],
      });
    } catch (e) {
      console.warn('Local notification scheduling failed:', e);
    }
  }, []);

  // Reconcile reminder whenever app returns foreground (helps after OEM task policies).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = App.addListener('resume', async () => {
      if (profile?.mining_disabled) return;
      if (!profile?.last_mined_at) return;
      const minedAt = new Date(profile.last_mined_at).getTime();
      if (Number.isNaN(minedAt)) return;
      const dueAt = minedAt + MINING_COOLDOWN_MS;
      if (dueAt <= Date.now()) return;
      await scheduleMiningNotification(new Date(dueAt));
    });
    return () => {
      void listenerPromise.then((l) => l.remove());
    };
  }, [profile?.last_mined_at, profile?.mining_disabled, scheduleMiningNotification]);

  // Mine: always exactly MINING_REWARD (10) points, no ad bonus
  const handleMine = useCallback(async () => {
    if (!user || isMining || centerButtonActive) return;

    const { data: gate, error: gateErr } = await supabase
      .from('users')
      .select('point, mining_disabled')
      .eq('id', user.id)
      .single();

    if (gateErr) {
      console.error('Mining gate check failed:', gateErr);
      toast.error('채굴 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (gate?.mining_disabled) {
      toast.error(
        '관리자에 의해 채굴이 중단되었습니다. 하단 광고 보상도 이용할 수 없습니다. 문의는 고객지원을 이용해 주세요.',
        { duration: 6000 },
      );
      await refreshProfile();
      return;
    }

    setIsMining(true);

    const now = new Date().toISOString();

    const currentPoint = gate?.point ?? profile?.point ?? 0;

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
    setAdCooldownEndsAt(null);
    await refreshProfile();
    toast.success(`+${MINING_REWARD} PTS — Mining complete!`);
    // 4시간 뒤 알림 예약
    await scheduleMiningNotification(new Date(Date.now() + MINING_COOLDOWN_MS));
    setIsMining(false);
  }, [user, isMining, centerButtonActive, profile, refreshProfile, scheduleMiningNotification]);

  // Ad watched: award PTS on Rewarded. Returns true if 10s cooldown should start after ad is dismissed (X).
  const handleWatchAd = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data: gate, error: gateErr } = await supabase
      .from('users')
      .select('mining_disabled')
      .eq('id', user.id)
      .single();

    if (gateErr) {
      console.error('Ad reward gate check failed:', gateErr);
      toast.error('정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }

    if (gate?.mining_disabled) {
      toast.error(
        '관리자에 의해 채굴·광고 보상이 중단된 계정입니다. 문의는 고객지원을 이용해 주세요.',
        { duration: 6000 },
      );
      await refreshProfile();
      return false;
    }

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
  }, [user, activeSlots, profile, refreshProfile, centerButtonActive]);

  // 항상 최신 handleMine을 참조하도록 ref 유지 (stale closure 방지)
  const handleMineRef = useRef(handleMine);
  useEffect(() => {
    handleMineRef.current = handleMine;
  }, [handleMine]);

  const handleCenterButtonClick = useCallback(() => {
    if (centerButtonActive || isMining || interstitialInFlightRef.current) return;

    if (miningBlocked) {
      toast.error(
        '관리자에 의해 채굴이 중단되었습니다. 문의는 고객지원을 이용해 주세요.',
        { duration: 6000 },
      );
      return;
    }

    interstitialInFlightRef.current = true;
    setIsInterstitialInFlight(true);

    let onDoneCalled = false;
    const onDone = async () => {
      if (onDoneCalled) return;
      onDoneCalled = true;
      try {
        await handleMineRef.current();
      } finally {
        interstitialInFlightRef.current = false;
        setIsInterstitialInFlight(false);
      }
    };

    showInterstitialAd(onDone).catch((e) => {
      console.warn('Ad failed, mining anyway:', e);
      void onDone();
    });
  }, [centerButtonActive, isMining, miningBlocked]);

  const handleSlotClick = () => {
    // Block slot taps during interstitial / rewarded to avoid ad call stacking.
    if (isInterstitialInFlight || interstitialInFlightRef.current || rewardedInFlightRef.current) return;
    if (miningBlocked) {
      toast.error(
        '관리자에 의해 채굴·광고 보상이 중단되었습니다. 문의는 고객지원을 이용해 주세요.',
        { duration: 6000 },
      );
      return;
    }
    if (canOpenRewardedAdSlotModal(centerButtonActive, activeSlots.length, adCooldown)) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (!centerButtonActive && isModalOpen) setIsModalOpen(false);
  }, [centerButtonActive, isModalOpen]);

  const getSlotColor = (slot: number) => {
    if (
      miningBlocked ||
      !centerButtonActive ||
      isInterstitialInFlight ||
      interstitialInFlightRef.current
    ) {
      return 'cursor-not-allowed border border-zinc-700/80 bg-zinc-900/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
    }
    const isActive = activeSlots.includes(slot);
    if (isActive) {
      const intensity = activeSlots.length / 5;
      if (intensity >= 0.8) return 'bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-cyan-300 shadow-lg shadow-cyan-400/60';
      if (intensity >= 0.6) return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50';
      return 'bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-500 shadow-lg shadow-cyan-500/40';
    }
    if (adCooldown > 0) {
      return 'cursor-not-allowed border border-zinc-700/80 bg-zinc-900/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
    }
    return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-cyan-500/50 cursor-pointer';
  };

  const slotIcon = (slot: number) => {
    if (miningBlocked || !centerButtonActive) {
      return <Lock className="h-5 w-5 text-zinc-500" aria-hidden strokeWidth={2} />;
    }
    if (activeSlots.includes(slot)) {
      return (
        <Zap className="h-5 w-5 fill-white text-white transition-colors" aria-hidden />
      );
    }
    if (adCooldown > 0) {
      return <Timer className="h-5 w-5 text-zinc-500" aria-hidden strokeWidth={2} />;
    }
    return (
      <Zap
        className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-cyan-400"
        aria-hidden
      />
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col pt-2 pb-1 sm:pt-3 sm:pb-1">
      {/* Mining logo → timer → points card: one block, shift down together */}
      <div className="mt-6 flex w-full shrink-0 flex-col sm:mt-8">
        <div className="flex shrink-0 flex-col items-center px-6 pt-1 min-[400px]:pt-2 sm:pt-3">
        {miningBlocked && (
          <div
            role="alert"
            className="mb-4 w-full max-w-md rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-center text-sm leading-snug text-amber-100"
          >
            관리자에 의해 <strong className="font-semibold text-amber-50">채굴이 중단</strong>된 계정입니다. 로고
            채굴·하단 광고 보상을 이용할 수 없습니다. 해제 문의는 고객지원을 이용해 주세요.
          </div>
        )}
        {/* Glowing Circular Button */}
        <div className="relative mb-4 max-[380px]:mb-3">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-3xl scale-125 animate-pulse transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-30' : 'opacity-10'
          }`}></div>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-2xl scale-110 transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-20' : 'opacity-5'
          }`}></div>

          <button
            onClick={handleCenterButtonClick}
            disabled={centerButtonActive || isMining || isInterstitialInFlight || miningBlocked}
            aria-label={
              miningBlocked
                ? '채굴 중단됨'
                : centerButtonActive
                  ? 'Mining in progress'
                  : 'Start Mining'
            }
            className={`relative h-48 w-48 max-[380px]:h-44 max-[380px]:w-44 overflow-hidden rounded-full p-[3px] shadow-2xl transition-all duration-300 ${
              miningBlocked
                ? 'cursor-not-allowed opacity-45 grayscale-[0.35] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black'
                : centerButtonActive
                  ? 'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 shadow-blue-500/45 hover:scale-105 active:scale-95'
                  : 'cursor-pointer bg-gradient-to-br from-purple-700/95 via-blue-800/95 to-indigo-900/95 shadow-black/40 hover:scale-[1.02]'
            }`}
          >
            <div className="relative box-border flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-full bg-[#000000] p-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.88),inset_0_1px_2px_rgba(255,255,255,0.04)]">
              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
                <img
                  src={miningCenterLogo}
                  alt="Web3Star mining logo"
                  className={`block h-full w-full translate-x-[-1.18%] translate-y-[-1.1%] object-contain object-center mix-blend-screen transition-all duration-300 ${
                    centerButtonActive
                      ? 'saturate-[1.15] contrast-[1.12] brightness-110'
                      : 'saturate-[1.08] contrast-[1.08] brightness-[1.04]'
                  }`}
                />
              </div>
            </div>
            <span
              className={`pointer-events-none absolute inset-[3px] z-[1] rounded-full ring-1 ring-inset transition-colors duration-300 ${
                centerButtonActive ? 'ring-white/15' : 'ring-white/[0.06]'
              }`}
              aria-hidden
            />
          </button>
        </div>

        {/* Countdown Timer */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tracking-wider bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
          </div>
          <div className="mt-2 text-xs uppercase tracking-widest text-gray-500">Next Mining Cycle</div>
        </div>
        </div>

        <div className="h-4 shrink-0 sm:h-5" aria-hidden />

        <div className="mt-2 shrink-0 px-6 pb-1 pt-0 sm:pb-1">
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium text-zinc-300">Get More Points</span>
                <span className="text-xs text-cyan-500">+5 PTS per ad</span>
              </div>
              {!centerButtonActive && (
                <p className="mt-1 text-[11px] leading-snug text-cyan-500/90">
                  Mine with the logo above to unlock these slots.
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {adCooldown > 0 && (
                <span className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-cyan-400/90">
                  {adCooldown}s
                </span>
              )}
              <span className="text-xs font-medium text-cyan-400/90 tabular-nums">
                {activeSlots.length}/5
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {[1, 2, 3, 4, 5].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={handleSlotClick}
                disabled={
                  miningBlocked ||
                  !centerButtonActive ||
                  activeSlots.includes(slot) ||
                  adCooldown > 0 ||
                  isInterstitialInFlight
                }
                aria-label={`Ad slot ${slot}${
                  miningBlocked
                    ? ', 채굴 중단으로 잠김'
                    : !centerButtonActive
                    ? ', locked until you mine'
                    : activeSlots.includes(slot)
                      ? ', completed'
                      : adCooldown > 0
                        ? ', on cooldown'
                        : ', watch ad'
                }`}
                className={`group flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${getSlotColor(slot)}`}
              >
                {slotIcon(slot)}
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
              <span className="text-xs text-zinc-500">
                Next slot in{' '}
                <span className="font-mono font-medium text-cyan-400/85">{adCooldown}s</span>
              </span>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 광고 슬롯 모달 (하단 번개 버튼용) */}
      <GetMorePointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWatchAd={async () => {
          // Rewarded ad 중복 show 방지
          if (rewardedInFlightRef.current) return;
          rewardedInFlightRef.current = true;
          setIsModalOpen(false);
          try {
            let startCooldownAfterDismiss = false;
            await showRewardedAd(
              async () => {
                startCooldownAfterDismiss = await handleWatchAd();
              },
              async () => {
                if (startCooldownAfterDismiss) {
                  setAdCooldownEndsAt(Date.now() + AD_COOLDOWN_SECONDS * 1000);
                }
              }
            );
          } finally {
            rewardedInFlightRef.current = false;
          }
        }}
        triggerSource="slot"
      />
    </div>
  );
}
