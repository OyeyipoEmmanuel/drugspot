export const useMockMode =
  import.meta.env.MODE === "test" || import.meta.env.VITE_USE_MOCK_API === "true";

export const useLiveBackend =
  !useMockMode && import.meta.env.VITE_USE_LIVE_BACKEND !== "false";

