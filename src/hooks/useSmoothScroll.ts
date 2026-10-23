import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionPreference } from "./useMotionPreference";
gsap.registerPlugin(ScrollTrigger);
/** The same GSAP ticker drives Lenis; touch and reduced motion keep native scrolling. */
export function useSmoothScroll(enabled: boolean) {
  const reduced = useMotionPreference();
  useEffect(() => {
    if (!enabled || reduced) return;
    const media = matchMedia("(min-width: 801px) and (pointer: fine)");
    let dispose: (() => void) | undefined;
    const setup = () => {
      dispose?.();
      dispose = undefined;
      if (!media.matches) return;
      const lenis = new Lenis({
        autoRaf: false,
        duration: 0.95,
        anchors: { offset: -100 },
        syncTouch: false,
        prevent: (node) =>
          !!node.closest(
            "[data-native-scroll], .dev-panel, #mobile-nav, textarea, select",
          ),
      });
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      const unsubscribe = lenis.on("scroll", () => ScrollTrigger.update());
      gsap.ticker.add(tick);
      document.documentElement.dataset.smoothScroll = "lenis";
      dispose = () => {
        gsap.ticker.remove(tick);
        unsubscribe();
        lenis.destroy();
        delete document.documentElement.dataset.smoothScroll;
      };
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      media.removeEventListener("change", setup);
      dispose?.();
    };
  }, [enabled, reduced]);
}
