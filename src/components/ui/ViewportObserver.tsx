'use client';

import { useEffect } from 'react';

/** Keep overlays inside the visible viewport when a mobile keyboard opens. */
export function ViewportObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    let restingHeight = window.innerHeight;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = viewport?.height ?? window.innerHeight;
        root.style.setProperty('--visual-viewport-height', `${height}px`);
        root.style.setProperty('--visual-viewport-top', `${viewport?.offsetTop ?? 0}px`);
        const element = document.activeElement;
        const editing =
          element instanceof HTMLTextAreaElement ||
          (element instanceof HTMLInputElement &&
            !['button', 'submit', 'checkbox', 'radio', 'file', 'range'].includes(element.type)) ||
          (element instanceof HTMLElement && element.isContentEditable);
        if (!editing) restingHeight = window.innerHeight;
        root.dataset.keyboardOpen = String(
          !!editing &&
            (viewport?.scale ?? 1) === 1 &&
            Math.max(restingHeight, window.innerHeight) - height > 150,
        );
      });
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--visual-viewport-top');
      delete root.dataset.keyboardOpen;
    };
  }, []);
  return null;
}
