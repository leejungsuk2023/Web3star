import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * True while the soft keyboard is likely open. On native, uses Capacitor Keyboard (reliable on Android
 * with adjustResize where visualViewport alone often fails). Falls back to visualViewport on web.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const state = { disposed: false, remove: null as null | (() => void) };

    const fallbackVisualViewport = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const update = () => {
        if (state.disposed) return;
        const gap = window.innerHeight - vv.offsetTop - vv.height;
        setOpen(gap > 72);
      };
      update();
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      const prev = state.remove;
      state.remove = () => {
        prev?.();
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      };
    };

    if (Capacitor.isNativePlatform()) {
      void Promise.all([
        Keyboard.addListener('keyboardDidShow', () => {
          if (!state.disposed) setOpen(true);
        }),
        Keyboard.addListener('keyboardDidHide', () => {
          if (!state.disposed) setOpen(false);
        }),
      ])
        .then(([h1, h2]) => {
          if (state.disposed) {
            h1.remove();
            h2.remove();
            return;
          }
          state.remove = () => {
            h1.remove();
            h2.remove();
          };
        })
        .catch(() => {
          if (!state.disposed) fallbackVisualViewport();
        });
    } else {
      fallbackVisualViewport();
    }

    return () => {
      state.disposed = true;
      state.remove?.();
    };
  }, []);

  return open;
}
