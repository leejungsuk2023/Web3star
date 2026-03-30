import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Scroll the focused field so it stays visible above the virtual keyboard.
 * Prefer scrolling a known auth/modal scroll root; avoids Android WebView issues with window scroll.
 */
export function scrollAuthInputIntoView(el: HTMLElement): void {
  const modalRoot = el.closest<HTMLElement>('[data-modal-scroll-root]');
  if (modalRoot) {
    const pad = 12;
    const elRect = el.getBoundingClientRect();
    const rootRect = modalRoot.getBoundingClientRect();
    const deltaBottom = elRect.bottom - (rootRect.bottom - pad);
    if (deltaBottom > 0) {
      modalRoot.scrollTop += deltaBottom;
    }
    const deltaTop = rootRect.top + pad - elRect.top;
    if (deltaTop > 0) {
      modalRoot.scrollTop -= deltaTop;
    }
    return;
  }

  const authRoot = el.closest<HTMLElement>('[data-auth-scroll-root]');
  if (authRoot) {
    const elRect = el.getBoundingClientRect();
    const rootRect = authRoot.getBoundingClientRect();
    const targetTop =
      authRoot.scrollTop + (elRect.top - rootRect.top) - authRoot.clientHeight / 2 + elRect.height / 2;
    authRoot.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    return;
  }

  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function scheduleScrollToTarget(target: HTMLElement): void {
  const run = () => scrollAuthInputIntoView(target);
  run();
  window.setTimeout(run, 280);
  window.setTimeout(run, 520);
}

/** Attach focusin listener; returns cleanup. */
export function attachAuthKeyboardScroll(container: Document | HTMLElement = document): () => void {
  const onFocusIn = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    window.setTimeout(() => scheduleScrollToTarget(target), 50);
  };
  container.addEventListener('focusin', onFocusIn);
  return () => container.removeEventListener('focusin', onFocusIn);
}
