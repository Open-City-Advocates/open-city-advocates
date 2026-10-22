import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { ocaLinksPlugin } from "./src/lib/markdown-links.mjs";

export default defineConfig({
  site: "https://www.opencityadvocates.org",
  output: "static",

  // Same folder names as the YJP site: static/ holds files copied as-is,
  // public/ is the build output that wrangler.jsonc serves.
  publicDir: "./static",
  outDir: "./public",

  // Squarespace published every page without an extension or trailing slash
  // (/our-team). "file" writes our-team.html, which Cloudflare's default
  // html_handling serves at /our-team with a 200 and no redirect, so every
  // link people have saved keeps working.
  build: {
    format: "file",
  },
  trailingSlash: "never",

  markdown: {
    // Sätteri's smart punctuation matches Hugo's typographer ("--" is an en
    // dash, "---" an em dash). The plugin carries over Hugo's link hooks.
    processor: satteri({ hastPlugins: [ocaLinksPlugin()] }),
  },
});
