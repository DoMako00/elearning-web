import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

declare const process: { env: Record<string, string | undefined> };

/* Public origin used in canonical links and the sitemap. Override at build time with VITE_SITE_URL. */
const SITE_URL = (process.env.VITE_SITE_URL || "https://medwayy.cloud").replace(/\/+$/, "");

/* Fills %SITE_URL% in index.html and emits robots.txt and sitemap.xml. Only the sign-in page is public. */
function seoAssets(): Plugin {
  return {
    name: "seo-assets",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", SITE_URL),
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: ["User-agent: *", "Allow: /auth/sign-in", "Disallow: /", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n"),
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/auth/sign-in</loc></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoAssets()],
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys and keep the entry bundle small.
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 40 },
            { name: "vendor-mantine", test: /node_modules[\\/]@mantine[\\/]/, priority: 30 },
            { name: "vendor-motion", test: /node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/, priority: 30 },
            { name: "vendor-data", test: /node_modules[\\/](@supabase|@tanstack|openapi-fetch)[\\/]/, priority: 30 },
          ],
        },
      },
    },
  },
});
