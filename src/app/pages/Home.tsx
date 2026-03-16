import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import GetMorePointModal from '../components/GetMorePointModal';
import WLogoSvg from '../components/WLogoSvg';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const MINING_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const MINING_REWARD = 10;

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
  const [modalTriggerSource, setModalTriggerSource] = useState<'slot' | 'center'>('slot');
  const [isMining, setIsMining] = useState(false);

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      const remaining = getTimeRemaining(profile.last_mined_at);
      setTime(remaining);

      // Check if mining is on cooldown (center button should be active/glowing)
      if (profile.last_mined_at) {
        const elapsed = Date.now() - new Date(profile.last_mined_at).getTime();
        setCenterButtonActive(elapsed < MINING_COOLDOWN_MS);
      }

      // Load ad slots from DB
      const slots = profile.ad_slots_viewed;
      if (Array.isArray(slots)) {
        setActiveSlots(slots);
      }
    }
  }, [profile]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (profile?.last_mined_at) {
        const remaining = getTimeRemaining(profile.last_mined_at);
        setTime(remaining);

        // When timer hits zero, reset center button
        if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
          setCenterButtonActive(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile?.last_mined_at]);

  const formatTime = (value: number) => String(value).padStart(2, '0');

  const handleMine = useCallback(async () => {
    if (!user || isMining || centerButtonActive) return;
    setIsMining(true);

    const now = new Date().toISOString();

    // Ad bonus: +1pt per watched slot (1~5 slots = +1~5pt)
    const adBonus = activeSlots.length;

    const totalReward = MINING_REWARD + adBonus;

    // Fetch latest point from DB to avoid stale client-side value
    const { data: freshUser } = await supabase
      .from('users')
      .select('point')
      .eq('id', user.id)
      .single();

    const currentPoint = freshUser?.point ?? profile?.point ?? 0;

    // Update user points and last_mined_at
    const { error: updateError } = await supabase
      .from('users')
      .update({
        point: currentPoint + totalReward,
        last_mined_at: now,
        ad_slots_viewed: [], // reset slots after mining
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Mining failed:', updateError);
      toast.error('Mining failed. Please try again.');
      setIsMining(false);
      return;
    }

    // Log mining event
    const { error: logError } = await supabase.from('mining_logs').insert({
      user_id: user.id,
      amount: MINING_REWARD,
      type: 'MINING',
    });
    if (logError) console.error('Failed to log mining:', logError);

    // Log ad bonus if any
    if (adBonus > 0) {
      const { error: adLogError } = await supabase.from('mining_logs').insert({
        user_id: user.id,
        amount: adBonus,
        type: 'AD_POINT',
        slot_number: activeSlots.length,
      });
      if (adLogError) console.error('Failed to log ad bonus:', adLogError);
    }

    setCenterButtonActive(true);
    setActiveSlots([]);
    await refreshProfile();
    toast.success(`+${totalReward} Points earned!`);
    setIsMining(false);
  }, [user, isMining, centerButtonActive, activeSlots, profile, refreshProfile]);

  const handleWatchAd = useCallback(async () => {
    if (!user) return;
    setIsModalOpen(false);

    if (modalTriggerSource === 'center') {
      await handleMine();
    } else {
      if (activeSlots.length < 5) {
        const nextSlot = [1, 2, 3, 4, 5].find(s => !activeSlots.includes(s));
        if (!nextSlot) return;
        const newSlots = [...activeSlots, nextSlot];
        setActiveSlots(newSlots);

        const { error: slotError } = await supabase
          .from('users')
          .update({ ad_slots_viewed: newSlots })
          .eq('id', user.id);

        if (slotError) {
          console.error('Failed to save ad slot:', slotError);
          setActiveSlots(activeSlots); // rollback
          toast.error('Failed to save progress.');
          return;
        }

        toast.success(`Slot ${nextSlot}/5 activated! +1 bonus point`);
        await refreshProfile();
      }
    }
  }, [user, modalTriggerSource, activeSlots, handleMine, refreshProfile]);

  const handleCenterButtonClick = () => {
    if (!centerButtonActive) {
      setModalTriggerSource('center');
      setIsModalOpen(true);
    }
  };

  const handleSlotClick = () => {
    if (activeSlots.length < 5) {
      setModalTriggerSource('slot');
      setIsModalOpen(true);
    }
  };

  const getSlotColor = (slot: number) => {
    const isActive = activeSlots.includes(slot);

    if (isActive) {
      const intensity = activeSlots.length / 5;
      if (intensity >= 0.8) {
        return 'bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-cyan-300 shadow-lg shadow-cyan-400/60';
      } else if (intensity >= 0.6) {
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50';
      } else {
        return 'bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-500 shadow-lg shadow-cyan-500/40';
      }
    }
    return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-cyan-500/50 cursor-pointer';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Center Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Glowing Circular Button */}
        <div className="relative mb-8">
          {/* Outer glow rings */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-3xl scale-125 animate-pulse transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-30' : 'opacity-10'
          }`}></div>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-2xl scale-110 transition-opacity duration-500 ${
            centerButtonActive ? 'opacity-20' : 'opacity-5'
          }`}></div>

          {/* Main button */}
          <button
            onClick={handleCenterButtonClick}
            disabled={centerButtonActive || isMining}
            aria-label={centerButtonActive ? 'Mining in progress' : 'Start Mining'}
            className={`relative w-56 h-56 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              centerButtonActive
                ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-blue-500/50 hover:scale-105 active:scale-95'
                : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-gray-800/30 hover:scale-102 cursor-pointer'
            }`}
          >
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-black/40 backdrop-blur-sm"></div>

            {/* W Logo SVG */}
            <WLogoSvg
              className="relative z-10 w-32 h-32"
              isActive={centerButtonActive}
            />

            {/* Border ring */}
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

      {/* Bottom Section - Get More Point Slots */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-medium">Get More Point</span>
            <span className="text-xs text-cyan-400">{activeSlots.length}/5</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            {[1, 2, 3, 4, 5].map((slot) => (
              <button
                key={slot}
                onClick={handleSlotClick}
                disabled={activeSlots.includes(slot)}
                aria-label={`Ad slot ${slot}${activeSlots.includes(slot) ? ' (watched)' : ''}`}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${getSlotColor(slot)}`}
              >
                <Zap
                  className={`w-5 h-5 transition-colors ${
                    activeSlots.includes(slot)
                      ? 'text-white fill-white'
                      : 'text-gray-600 group-hover:text-cyan-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Get More Point Modal */}
      <GetMorePointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWatchAd={handleWatchAd}
        triggerSource={modalTriggerSource}
      />
    </div>
  );
}
