import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const getSnapshot = () => window.matchMedia(query).matches;
/** Subscribe to live OS preference changes, including while an animation is running. */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
