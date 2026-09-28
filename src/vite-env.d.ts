/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_DASHBOARD_ENROLLMENT_STATE?:
    | "loading"
    | "empty"
    | "enrolled"
    | "error";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
