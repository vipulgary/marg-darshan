/** Shared helpers for canvas effects: frame-capped rAF that only runs while on screen and the tab is visible. */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function runWhileVisible(target: Element, fps: number, frame: (now: number) => void): () => void {
  const interval = 1000 / fps;
  let raf = 0;
  let last = 0;
  let onScreen = false;
  let disposed = false;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const elapsed = now - last;
    if (elapsed < interval) return;
    last = now - (elapsed % interval);
    frame(now);
  };

  const sync = () => {
    const shouldRun = !disposed && onScreen && document.visibilityState === "visible";
    if (shouldRun && !raf) {
      raf = requestAnimationFrame(tick);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    sync();
  });
  io.observe(target);
  document.addEventListener("visibilitychange", sync);

  return () => {
    disposed = true;
    sync();
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}

type IdleHandle = { cancel: () => void };

/** requestIdleCallback with a timeout fallback (Safari has no rIC). */
export function whenIdle(cb: () => void, timeout = 1500): IdleHandle {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout });
    return { cancel: () => window.cancelIdleCallback(id) };
  }
  const id = window.setTimeout(cb, 200);
  return { cancel: () => window.clearTimeout(id) };
}
