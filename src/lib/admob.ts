import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

const INTERSTITIAL_AD_ID = 'ca-app-pub-7386110967445510/4672420595';
const REWARDED_AD_ID = 'ca-app-pub-7386110967445510/9098750762';

const isNative = () => Capacitor.isNativePlatform();

let interstitialReady = false;

/**
 * AdMob 초기화 (네이티브에서만). 앱 시작 시 한 번 호출.
 */
export async function initAdMob(): Promise<void> {
  if (!isNative()) return;
  try {
    await AdMob.initialize();
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

/**
 * 전면 광고를 미리 로딩.
 */
export async function preloadInterstitialAd(): Promise<void> {
  if (!isNative()) return;
  if (interstitialReady) return;
  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: true,
    });
    interstitialReady = true;
  } catch (e) {
    console.warn('Interstitial preload failed:', e);
    interstitialReady = false;
  }
}

/**
 * 전면 광고(Interstitial) 표시. 닫힌 후 onDone 호출.
 * Dismissed / FailedToShow 모두 onDone을 한 번만 호출하도록 보장.
 */
export async function showInterstitialAd(onDone: () => void | Promise<void>): Promise<void> {
  if (!isNative()) {
    await Promise.resolve(onDone());
    return;
  }

  let doneCalled = false;
  const callDoneOnce = async () => {
    if (doneCalled) return;
    doneCalled = true;
    interstitialReady = false;
    try {
      await Promise.resolve(onDone());
    } catch (e) {
      console.error('onDone callback error:', e);
    }
  };

  const listeners: { remove: () => Promise<void> }[] = [];
  const removeAllListeners = async () => {
    for (const l of listeners) {
      try { await l.remove(); } catch { /* ignore */ }
    }
    listeners.length = 0;
  };

  try {
    const dismissedListener = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      async () => {
        await removeAllListeners();
        await callDoneOnce();
      }
    );
    listeners.push(dismissedListener);

    const failedListener = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      async () => {
        await removeAllListeners();
        await callDoneOnce();
      }
    );
    listeners.push(failedListener);

    if (!interstitialReady) {
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_ID,
        isTesting: true,
      });
    }
    interstitialReady = false;
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('Interstitial ad failed:', e);
    await removeAllListeners();
    await callDoneOnce();
  }
}

/**
 * 보상형 광고(Rewarded) 표시. 시청 완료 시에만 onReward 호출.
 * 웹에서는 onReward를 바로 호출(테스트용).
 */
export async function showRewardedAd(onReward: () => void | Promise<void>): Promise<void> {
  if (!isNative()) {
    await Promise.resolve(onReward());
    return;
  }

  let rewardListener: { remove: () => Promise<void> } | null = null;
  let dismissedListener: { remove: () => Promise<void> } | null = null;

  try {
    rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async () => {
      await Promise.resolve(onReward());
    });

    dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
      // 광고를 닫을 때 리스너 정리 (보상 여부는 Rewarded 이벤트로만 판단)
      if (rewardListener) {
        await rewardListener.remove();
        rewardListener = null;
      }
      if (dismissedListener) {
        await dismissedListener.remove();
        dismissedListener = null;
      }
    });

    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: true,
    });
    await AdMob.showRewardVideoAd();
  } catch (e) {
    console.warn('Rewarded ad failed:', e);
    if (rewardListener) {
      await rewardListener.remove();
      rewardListener = null;
    }
    if (dismissedListener) {
      await dismissedListener.remove();
      dismissedListener = null;
    }
  }
}
