/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_USE_LIVE_BACKEND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
