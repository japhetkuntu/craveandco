'use client';

import { useEffect } from 'react';

const INPUT_SELECTOR = 'input, textarea, select, [contenteditable]';

export function useVirtualKeyboard() {
  useEffect(() => {
    const root = document.documentElement;
    let focusTimeout: number | undefined;

    const setViewportVars = () => {
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const keyboardOffset = viewport ? Math.max(0, window.innerHeight - viewport.height) : 0;

      root.style.setProperty('--viewport-height', `${viewportHeight}px`);
      root.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.matches(INPUT_SELECTOR)) return;

      window.clearTimeout(focusTimeout);
      focusTimeout = window.setTimeout(() => {
        if (document.activeElement === target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }, 300);
    };

    setViewportVars();
    window.addEventListener('resize', setViewportVars);
    window.addEventListener('orientationchange', setViewportVars);
    document.documentElement.addEventListener('focusin', handleFocusIn, true);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', setViewportVars);
    visualViewport?.addEventListener('scroll', setViewportVars);

    return () => {
      window.removeEventListener('resize', setViewportVars);
      window.removeEventListener('orientationchange', setViewportVars);
      document.documentElement.removeEventListener('focusin', handleFocusIn, true);
      visualViewport?.removeEventListener('resize', setViewportVars);
      visualViewport?.removeEventListener('scroll', setViewportVars);
      if (focusTimeout) {
        window.clearTimeout(focusTimeout);
      }
    };
  }, []);
}
