import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

// Google 테스트 광고 ID (배포 시 AdMob 콘솔에서 발급한 본인 광고 단위 ID로 교체, isTesting: false)
const INTERSTITIAL_AD_ID = 'ca-app-pub-7386110967445510/4672420595';
const REWARDED_AD_ID = 'ca-app-pub-7386110967445510/9098750762';

const isNative = () => Capacitor.isNativePlatform();

let interstitialDismissListener: { remove: () => Promise<void> } | null = null;
let interstitialReady = false; // 광고가 미리 로딩됐는지 여부

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
 * 전면 광고를 미리 로딩. W 버튼이 활성화될 때 호출하면 클릭 즉시 광고 표시 가능.
 */
export async function preloadInterstitialAd(): Promise<void> {
  if (!isNative()) return;
  if (interstitialReady) return; // 이미 로딩됨
  try {
    if (interstitialDismissListener) {
      await interstitialDismissListener.remove();
      interstitialDismissListener = null;
    }
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
 * 전면 광고(Interstitial) 표시. 시청 완료(닫기) 시 onDone 호출.
 * 미리 로딩된 광고가 있으면 즉시 표시. 없으면 그 자리에서 로딩 후 표시.
 * 웹에서는 onDone을 바로 호출(테스트용).
 */
export async function showInterstitialAd(onDone: () => void | Promise<void>): Promise<void> {
  if (!isNative()) {
    await Promise.resolve(onDone());
    return;
  }

  try {
    if (interstitialDismissListener) {
      await interstitialDismissListener.remove();
      interstitialDismissListener = null;
    }

    interstitialDismissListener = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      async () => {
        if (interstitialDismissListener) {
          await interstitialDismissListener.remove();
          interstitialDismissListener = null;
        }
        interstitialReady = false;
        await Promise.resolve(onDone());
      }
    );

    // 미리 로딩 안 됐으면 지금 로딩
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
    if (interstitialDismissListener) {
      await interstitialDismissListener.remove();
      interstitialDismissListener = null;
    }
    interstitialReady = false;
    await Promise.resolve(onDone());
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
