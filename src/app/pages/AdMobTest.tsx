import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { showInterstitialAd, showRewardedAd } from '../../lib/admob';

export default function AdMobTest() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0f] p-6 text-white">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
        <h1 className="text-xl font-bold mb-2">AdMob Test</h1>
        <p className="text-sm text-gray-400 mb-6">
          {Capacitor.isNativePlatform()
            ? '로그인 없이 광고 노출만 확인하는 화면입니다.'
            : '웹에서는 광고가 뜨지 않고, 광고가 끝난 것처럼 토스트만 뜹니다.'}
        </p>

        <div className="space-y-3">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await showInterstitialAd(async () => {
                toast.success('Interstitial dismissed');
              });
              setBusy(false);
            }}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-60"
          >
            Show Interstitial
          </button>

          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await showRewardedAd(async () => {
                toast.success('Rewarded!');
              });
              setBusy(false);
            }}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 disabled:opacity-60"
          >
            Show Rewarded
          </button>
        </div>
      </div>
    </div>
  );
}

