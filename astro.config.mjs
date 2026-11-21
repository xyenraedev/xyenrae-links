// @ts-check
import { defineConfig } from "astro/config";

/**
 * One static page. No adapter, no framework, no client runtime.
 *
 * Fonts are imported from the page so Vite fingerprints and serves them from
 * `/_astro`, which keeps every request same-origin: the page is opened inside
 * TikTok's in-app browser, and a third-party font CDN is one more host that can
 * be slow or blocked there.
 */
export default defineConfig({
  site: "https://links.xyenrae.dev",
  vite: {
    build: {
      // Vite inlines assets under 4 KB as `data:` URIs. The cyrillic-ext subset
      // of Plus Jakarta Sans falls under that limit, so it became an inline
      // font and the page's own CSP blocked it on load. Emitting every font as
      // a file keeps `font-src 'self'` strict and gives them the immutable
      // cache header they already have.
      assetsInlineLimit: 0,
    },
  },
});
