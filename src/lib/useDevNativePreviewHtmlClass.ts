import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Capacitor } from '@capacitor/core';

/**
 * DEV + `?nativePreview=1`: treat the page like the Capacitor shell (cap-native + optional chrome class)
 * so browser preview matches APK header insets / h-full chain.
 */
export function useDevNativePreviewHtmlClass() {
  const location = useLocation();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!import.meta.env.DEV) {
      document.documentElement.classList.remove('native-preview');
      return;
    }

    const on = new URLSearchParams(location.search).get('nativePreview') === '1';
    document.documentElement.classList.toggle('cap-native', on);
    document.documentElement.classList.toggle('native-preview', on);
  }, [location.pathname, location.search]);
}
