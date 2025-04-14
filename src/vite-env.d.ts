/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  readonly MAIN_WINDOW_VITE_NAME: string | undefined;
  readonly OPENROUTER_API_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}