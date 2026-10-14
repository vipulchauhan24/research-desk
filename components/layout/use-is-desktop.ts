import { useSyncExternalStore } from "react";

// Matches Tailwind's `md` breakpoint. CSS can hide controls, but only JS can make the editor non-editable on mobile.
const QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // The app is client-rendered; this only runs during the static prerender of the shell.
    () => false,
  );
}
