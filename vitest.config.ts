import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit/component tests only. Every network call is mocked; no test needs real
// credentials or touches a live API. The values below are inert placeholders.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
    env: {
      VITE_API_BASE_URL: "https://api.test.invalid",
      VITE_SUPABASE_URL: "https://auth.test.invalid",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
