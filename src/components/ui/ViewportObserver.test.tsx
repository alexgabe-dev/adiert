import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewportObserver } from './ViewportObserver';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ViewportObserver', () => {
  it('tracks a resized mobile keyboard, ignores pinch zoom, and cleans up', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 1),
    );
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);
    const { unmount } = render(
      <>
        <ViewportObserver />
        <input aria-label="Input" />
      </>,
    );
    act(() => {
      vi.runAllTimers();
    });
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--visual-viewport-height')).toBe('800px');
    act(() => {
      document.querySelector('input')!.focus();
      viewport.height = 400;
      vi.stubGlobal('innerHeight', 400);
      viewport.dispatchEvent(new Event('resize'));
      vi.runAllTimers();
    });
    expect(root.dataset.keyboardOpen).toBe('true');
    expect(root.style.getPropertyValue('--visual-viewport-height')).toBe('400px');
    act(() => {
      viewport.scale = 2;
      viewport.dispatchEvent(new Event('resize'));
      vi.runAllTimers();
    });
    expect(root.dataset.keyboardOpen).toBe('false');
    unmount();
    expect(root.dataset.keyboardOpen).toBeUndefined();
    expect(root.style.getPropertyValue('--visual-viewport-height')).toBe('');
  });
});
