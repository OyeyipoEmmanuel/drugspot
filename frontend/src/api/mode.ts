export const useLiveBackend =
  import.meta.env.MODE !== "test" && import.meta.env.VITE_USE_LIVE_BACKEND === "true";

