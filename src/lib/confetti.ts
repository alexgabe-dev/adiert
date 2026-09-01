import type { Options } from 'canvas-confetti';

function reducedMotionRequested() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function launchConfetti(options: Options) {
  if (reducedMotionRequested()) {
    return;
  }

  const { default: confetti } = await import('canvas-confetti');
  await confetti(options);
}
