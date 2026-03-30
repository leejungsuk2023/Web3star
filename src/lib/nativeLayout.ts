import { Capacitor } from '@capacitor/core';

const native = Capacitor.isNativePlatform();

/** Main app column (Capacitor WebView fills padded client rect; avoid 100dvh past insets) */
export const APP_SHELL_CLASS =
  native
    ? 'flex h-full min-h-0 w-full flex-1 flex-col bg-black'
    : 'flex h-screen max-h-dvh min-h-0 w-full flex-1 flex-col bg-black';

export const LAYOUT_ROOT_CLASS =
  native
    ? 'relative mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden text-white'
    : 'relative mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-md flex-col overflow-hidden text-white';

/** WebView top inset (MainActivity) + small inner gap */
export const LAYOUT_HEADER_PT_CLASS = native
  ? 'pt-2'
  : 'pt-[max(0.5rem,env(safe-area-inset-top,24px))]';

/** Extra lift under tab row if system inset is still 0 in WebView (env rarely works on Android) */
export const LAYOUT_NAV_PB_CLASS = native
  ? 'pb-[max(0.5rem,env(safe-area-inset-bottom,0px),1.25rem)]'
  : 'pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,24px)))]';

export const AUTH_PAGE_OUTER_CLASS =
  native
    ? 'flex h-full min-h-0 w-full flex-col bg-[#0a0a0f] text-white'
    : 'flex min-h-dvh flex-col bg-[#0a0a0f] text-white';

export const AUTH_PAGE_INNER_CLASS =
  native
    ? 'mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden'
    : 'mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-md flex-col overflow-hidden';

export const LOGIN_SCROLL_TOP_PT_CLASS =
  native ? 'pt-4' : 'pt-[max(1rem,env(safe-area-inset-top,24px))]';

export const SIGNUP_SCROLL_TOP_PT_CLASS =
  native ? 'pt-4' : 'pt-[max(1.25rem,env(safe-area-inset-top,0px))]';

export const LOGIN_FOOTER_PB_CLASS = native
  ? 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px),1.5rem)]'
  : 'pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,24px)))]';

export const SIGNUP_FOOTER_PB_CLASS = native
  ? 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px),1.5rem)]'
  : 'pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))]';

export const SPLASH_ROOT_CLASS =
  native
    ? 'flex h-full min-h-0 w-full flex-col items-center justify-center bg-[#0a0a0f]'
    : 'flex min-h-dvh w-full flex-col items-center justify-center bg-[#0a0a0f]';

export const PROTECTED_LOADING_H_CLASS = native ? 'h-full' : 'h-screen';

export const ADMOB_TEST_ROOT_CLASS =
  native
    ? 'flex h-full min-h-0 w-full items-center justify-center bg-[#0a0a0f] p-6 text-white'
    : 'flex min-h-dvh items-center justify-center bg-[#0a0a0f] p-6 text-white';
