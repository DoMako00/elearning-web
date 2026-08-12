export interface EnvConfig {
  apiBaseUrl: string;
}

function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/$/, "") ?? "";
}

export const env: Readonly<EnvConfig> = Object.freeze({
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL),
});
