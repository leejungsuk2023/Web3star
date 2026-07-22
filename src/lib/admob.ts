import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { toast } from 'sonner';

const INTERSTITIAL_AD_ID = 'ca-app-pub-7386110967445510/3744741213'; // AdMob "main ad" (전면)
const REWARDED_AD_ID = 'ca-app-pub-7386110967445510/9098750762'; // AdMob "BonusLoop_Rewarded" (보상형)
/** Google 공식 샘플 전면광고 — 실광고 no-fill 일 때 로고 탭 UX 확인용 폴백 */
const INTERSTITIAL_TEST_AD_ID = 'ca-app-pub-3940256099942544/1033173712';
/**
 * false: Play/실사용 — 실광고만 (샘플 폴백 없음)
 * true: 기기 확인용 — 실광고 실패 시 구글 샘플 전면 1회
 */
const ALLOW_TEST_INTERSTITIAL_FALLBACK = false;
const admobUseTestAds = false;

const isNative = () => Capacitor.isNativePlatform();

let interstitialReady = false;
let admobInitPromise: Promise<void> | null = null;
/** prepare/show 동시 호출 경합 방지 */
let interstitialLock: Promise<void> = Promise.resolve();

function withInterstitialLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = interstitialLock.then(fn, fn);
  interstitialLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function formatAdError(err: unknown): string {
  if (err == null) return 'unknown';
  if (typeof err === 'string') return err.slice(0, 120);
  const anyErr = err as { message?: string; code?: string | number; errorMessage?: string };
  const msg = anyErr.message ?? anyErr.errorMessage ?? JSON.stringify(err);
  return String(msg).slice(0, 120);
}

/**
 * AdMob 초기화 (네이티브에서만). 앱 시작 시 한 번 호출.
 */
export async function initAdMob(): Promise<void> {
  if (!isNative()) return;
  if (!admobInitPromise) {
    admobInitPromise = (async () => {
      try {
        await AdMob.initialize();
      } catch (e) {
        console.warn('AdMob init failed:', e);
        admobInitPromise = null;
        throw e;
      }
    })();
  }
  try {
    await admobInitPromise;
  } catch {
    /* init 실패해도 이후 재시도 가능 */
  }
}

/**
 * 네이티브 prepareInterstitial 은 onAdLoaded 때 resolve / onAdFailedToLoad 때 reject.
 * 만료된 preload 를 쓰지 않도록 항상 새로 로드한다.
 */
async function prepareInterstitialFresh(adId: string = INTERSTITIAL_AD_ID): Promise<void> {
  await initAdMob();
  interstitialReady = false;
  await AdMob.prepareInterstitial({
    adId,
    isTesting: admobUseTestAds,
    immersiveMode: true,
  });
  interstitialReady = true;
}

/**
 * 전면 광고를 미리 로딩 (클릭 지연 완화용). 실패해도 클릭 시 다시 로드한다.
 */
export async function preloadInterstitialAd(): Promise<void> {
  if (!isNative()) return;
  if (interstitialReady) return;
  try {
    await withInterstitialLock(async () => {
      if (interstitialReady) return;
      await prepareInterstitialFresh();
    });
  } catch (e) {
    console.warn('Interstitial preload failed:', e);
    interstitialReady = false;
  }
}

/**
 * 전면 광고(Interstitial) 표시. 닫힌 후 onDone 호출.
 *
 * 기존 버그:
 * - preload 성공 플래그만 믿고 show → 만료/무효 광고면 바로 실패 후 채굴만 진행
 * - 실패를 조용히 삼킴
 *
 * 수정:
 * - show 직전 항상 새로 prepare
 * - 락으로 경합 방지
 * - 1회 재시도 + 사용자에게 로딩/실패 toast
 */
export async function showInterstitialAd(onDone: () => void | Promise<void>): Promise<void> {
  if (!isNative()) {
    console.warn('showInterstitialAd: not native platform, skipping ad');
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

  const attemptShow = async (adId: string): Promise<void> => {
    await withInterstitialLock(async () => {
      await prepareInterstitialFresh(adId);

      const listeners: { remove: () => Promise<void> }[] = [];
      const removeAllListeners = async () => {
        for (const l of listeners) {
          try {
            await l.remove();
          } catch {
            /* ignore */
          }
        }
        listeners.length = 0;
      };

      await new Promise<void>((resolve, reject) => {
        void (async () => {
          try {
            const dismissedListener = await AdMob.addListener(
              InterstitialAdPluginEvents.Dismissed,
              async () => {
                await removeAllListeners();
                resolve();
              },
            );
            listeners.push(dismissedListener);

            const failedListener = await AdMob.addListener(
              InterstitialAdPluginEvents.FailedToShow,
              async (err) => {
                await removeAllListeners();
                reject(err ?? new Error('Interstitial failed to show'));
              },
            );
            listeners.push(failedListener);

            interstitialReady = false;
            // WebView 위에서 show 타이밍이 꼬이는 기기 완화
            await new Promise((r) => setTimeout(r, 150));
            await AdMob.showInterstitial();
          } catch (e) {
            await removeAllListeners();
            reject(e);
          }
        })();
      });
    });
  };

  const loadingId = 'web3star-interstitial-loading';
  try {
    toast.loading('Loading ad…', { id: loadingId, duration: 20000 });
    try {
      await attemptShow(INTERSTITIAL_AD_ID);
      toast.dismiss(loadingId);
    } catch (firstError) {
      console.warn('Interstitial production attempt failed:', firstError);
      interstitialReady = false;
      if (!ALLOW_TEST_INTERSTITIAL_FALLBACK) {
        toast.error(`Ad failed: ${formatAdError(firstError)}`, {
          id: loadingId,
          duration: 5000,
        });
      } else {
        try {
          // 실광고 no-fill/단위 문제여도 로고 탭 시 광고 UI가 뜨는지 확인
          toast.loading('Loading backup ad…', { id: loadingId, duration: 20000 });
          await attemptShow(INTERSTITIAL_TEST_AD_ID);
          toast.dismiss(loadingId);
        } catch (secondError) {
          console.warn('Interstitial test fallback failed:', secondError);
          toast.error(`Ad failed: ${formatAdError(secondError) || formatAdError(firstError)}`, {
            id: loadingId,
            duration: 5000,
          });
        }
      }
    }
  } finally {
    await callDoneOnce();
  }
}

/**
 * 보상형 광고. Rewarded 시 onReward, 광고 화면이 닫힐 때(Dismissed) onDismissed.
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
  let failedListener: { remove: () => Promise<void> } | null = null;
  let rewardInFlight: Promise<void> = Promise.resolve();

  let resolveFlow!: () => void;
  const flowDone = new Promise<void>((r) => {
    resolveFlow = r;
  });
  let flowEnded = false;

  const removeListeners = async () => {
    if (rewardListener) {
      try {
        await rewardListener.remove();
      } catch {
        /* ignore */
      }
      rewardListener = null;
    }
    if (dismissedListener) {
      try {
        await dismissedListener.remove();
      } catch {
        /* ignore */
      }
      dismissedListener = null;
    }
    if (failedListener) {
      try {
        await failedListener.remove();
      } catch {
        /* ignore */
      }
      failedListener = null;
    }
  };

  const finishFlowOnce = async () => {
    if (flowEnded) return;
    flowEnded = true;
    await rewardInFlight;
    await removeListeners();
    await Promise.resolve(onDismissed?.());
    resolveFlow();
  };

  try {
    rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async () => {
      rewardInFlight = Promise.resolve(onReward()).catch((e) => {
        console.error('Rewarded onReward error:', e);
      });
    });

    dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
      await finishFlowOnce();
    });

    failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, async () => {
      await finishFlowOnce();
    });

    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: admobUseTestAds,
      immersiveMode: true,
    });
    await AdMob.showRewardVideoAd();
    await flowDone;
  } catch (e) {
    console.warn('Rewarded ad failed:', e);
    if (!flowEnded) {
      await removeListeners();
      await Promise.resolve(onDismissed?.());
      flowEnded = true;
      resolveFlow();
    }
  }
}
