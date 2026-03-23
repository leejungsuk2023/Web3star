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
 * 보상형 광고. Rewarded 시 onReward, 광고 화면이 닫힐 때(Dismissed) onDismissed.
 * 쿨다운 등은 onDismissed에서 처리해, 광고 시청 중 백그라운드에서 타이머가 도는 문제를 막는다.
 */
export async function showRewardedAd(
  onReward: () => void | Promise<void>,
  onDismissed?: () => void | Promise<void>
): Promise<void> {
  if (!isNative()) {
    await Promise.resolve(onReward());
    await Promise.resolve(onDismissed?.());
    return;
  }

  let rewardListener: { remove: () => Promise<void> } | null = null;
  let dismissedListener: { remove: () => Promise<void> } | null = null;
  /** Rewarded handler may still be awaiting DB; Dismissed must wait so onDismissed sees correct state */
  let rewardInFlight: Promise<void> = Promise.resolve();

  try {
    rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async () => {
      rewardInFlight = Promise.resolve(onReward()).catch((e) => {
        console.error('Rewarded onReward error:', e);
      });
    });

    dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
      await rewardInFlight;
      if (rewardListener) {
        await rewardListener.remove();
        rewardListener = null;
      }
      if (dismissedListener) {
        await dismissedListener.remove();
        dismissedListener = null;
      }
      await Promise.resolve(onDismissed?.());
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
