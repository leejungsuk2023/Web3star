import React, { useCallback, useEffect, useRef, useState } from 'react';
import swipeDiamond from '../../assets/mining-swipe-diamond.png';
import swipeLock from '../../assets/mining-swipe-lock.png';

type MiningUnlockSliderProps = {
  enabled: boolean;
  unlocked: boolean;
  onUnlocked: () => void;
};

/** 문구(16px) 유지 — 썸은 트랙 안쪽에 여유 두고 수납 */
const TRACK_H = 58;
const THUMB_SIZE = 40;
const THUMB_INSET = 9;
const LOCK_RESERVE = 50;
const COMPLETE_RATIO = 0.88;

/**
 * 오토클릭 방지용 채굴 잠금해제 슬라이더.
 * 사실적 다이아/자물쇠 이미지 + 보라→시안 네온 트랙.
 */
export default function MiningUnlockSlider({
  enabled,
  unlocked,
  onUnlocked,
}: MiningUnlockSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  const updateOffset = (x: number) => {
    offsetRef.current = x;
    setOffset(x);
  };

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setMaxOffset(Math.max(0, el.clientWidth - THUMB_SIZE - THUMB_INSET * 2 - LOCK_RESERVE));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (!enabled) {
      updateOffset(0);
      draggingRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (unlocked && enabled && maxOffset > 0) {
      updateOffset(maxOffset);
    }
  }, [unlocked, enabled, maxOffset]);

  const clamp = (x: number) => Math.max(0, Math.min(maxOffset, x));

  const finishIfComplete = (x: number) => {
    if (!enabled || unlocked) return;
    if (maxOffset > 0 && x / maxOffset >= COMPLETE_RATIO) {
      updateOffset(maxOffset);
      onUnlocked();
      return;
    }
    updateOffset(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || unlocked) return;
    e.preventDefault();
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateOffset(clamp(e.clientX - rect.left - THUMB_INSET - THUMB_SIZE / 2));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !enabled || unlocked) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateOffset(clamp(e.clientX - rect.left - THUMB_INSET - THUMB_SIZE / 2));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishIfComplete(offsetRef.current);
  };

  const interactive = enabled && !unlocked;
  const showUnlocked = unlocked && enabled;
  const lit = interactive || showUnlocked;
  const thumbLeft = showUnlocked ? maxOffset : offset;

  return (
    <div className="w-full max-w-sm px-1">
      <div
        className={`relative rounded-full transition-opacity duration-300 ${
          lit ? 'opacity-100' : 'opacity-50'
        }`}
        style={
          lit
            ? {
                boxShadow:
                  '0 0 12px rgba(168,85,247,0.4), 0 0 26px rgba(34,211,238,0.32)',
              }
            : undefined
        }
      >
        <div
          ref={trackRef}
          className={`relative flex w-full items-center overflow-hidden rounded-full ${
            lit ? '' : 'border border-zinc-700/80 bg-zinc-950'
          }`}
          style={{
            height: TRACK_H,
            ...(lit
              ? {
                  backgroundImage:
                    'linear-gradient(90deg, #0c0a14, #0a0c16 45%, #071018), linear-gradient(90deg, #c026ff, #6366f1, #22d3ee)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  border: '2px solid transparent',
                }
              : {}),
          }}
          aria-disabled={!interactive}
        >
          {lit && (
            <div
              className="pointer-events-none absolute inset-[2px] rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, rgba(192,38,255,0.16), rgba(99,102,241,0.05) 40%, rgba(34,211,238,0.14))',
              }}
              aria-hidden
            />
          )}

          <span
            className={`pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-12 text-center text-[16px] font-semibold leading-none tracking-wide ${
              lit
                ? 'text-white/95 [text-shadow:0_0_12px_rgba(165,243,252,0.45)]'
                : 'text-zinc-500'
            }`}
          >
            {showUnlocked ? 'Mining Started' : 'Swipe to Unlock Mining'}
          </span>

          <button
            type="button"
            disabled={!interactive}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Swipe to unlock mining"
            className={`absolute top-1/2 z-20 flex -translate-y-1/2 items-center justify-center touch-none select-none border-0 p-0 ${
              interactive
                ? 'cursor-grab active:cursor-grabbing'
                : showUnlocked
                  ? 'cursor-default'
                  : 'cursor-not-allowed'
            }`}
            style={{
              left: THUMB_INSET + thumbLeft,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: '9999px',
              overflow: 'hidden',
              background: lit
                ? 'radial-gradient(circle, rgba(255,250,255,0.55) 0%, rgba(192,38,255,0.55) 48%, rgba(88,28,135,0.4) 100%)'
                : 'radial-gradient(circle, rgba(63,63,70,0.5), transparent 70%)',
              boxShadow: lit
                ? 'inset 0 0 0 1.5px rgba(244,114,182,0.95), 0 0 12px rgba(232,121,249,0.85), 0 0 22px rgba(168,85,247,0.45)'
                : 'none',
            }}
          >
            <img
              src={swipeDiamond}
              alt=""
              draggable={false}
              className="pointer-events-none block object-contain object-center"
              style={{
                width: '92%',
                height: '92%',
                opacity: lit ? 1 : 0.45,
              }}
              aria-hidden
            />
          </button>

          <div
            className="pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full"
            style={{
              right: THUMB_INSET,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              background: lit
                ? 'radial-gradient(circle, rgba(165,243,252,0.45) 0%, rgba(34,211,238,0.35) 50%, rgba(8,47,73,0.25) 100%)'
                : 'radial-gradient(circle, rgba(63,63,70,0.4), transparent 70%)',
              boxShadow: lit ? 'inset 0 0 0 1px rgba(34,211,238,0.9), 0 0 8px rgba(34,211,238,0.55)' : 'none',
            }}
            aria-hidden
          >
            <img
              src={swipeLock}
              alt=""
              draggable={false}
              className="object-contain"
              style={{
                width: THUMB_SIZE - 10,
                height: THUMB_SIZE - 10,
                filter: lit
                  ? 'brightness(1.3) contrast(1.15) drop-shadow(0 0 6px rgba(34,211,238,1))'
                  : 'grayscale(1) brightness(0.45)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
