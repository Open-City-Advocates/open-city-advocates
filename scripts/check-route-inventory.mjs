// Run after every build (npm run build). Fails the build if a URL people may
// have saved would break, or the sitemap points at a page that wasn't built.
//
// LIVE_URLS is the sitemap of the Squarespace site as of 2026-10-22. Each one
// must be a built page, a redirect in static/_redirects, or listed in
// RETIRED (Squarespace template pages that never had real content).

import { existsSync, readFileSync } from "node:fs";

const PUBLIC = "public";
const SITE = "https://www.opencityadvocates.org";

const LIVE_URLS = [
  "/",
  "/about-us",
  "/missions-and-values",
  "/our-team",
  "/join-us",
  "/join-us/legal-intern",
  "/join-our-team-1",
  "/news-updates",
  "/news-updates/our-2025-annual-report",
  "/news-updates/our-2024-annual-report-1",
  "/news-updates/our-2024-annual-report",
  "/news-updates/oca-releases-research-on-expanding-post-disposition-representation-of-youth",
  "/news-updates/the-roots-of-ocas-work",
  "/news-updates/2023/dc-reacts-to-enforcement-of-youth-curfew",
  "/policy-advocacy",
  "/policy-advocacy/record-sealing",
  "/post-disposition-defense-guide",
  "/a-call-to-expand-post-disposition-representation-of-youth-in-the-juvenile-legal-system",
  "/apply-for-access-to-the-post-disposition-defense-manual",
  "/penelope-spain",
  "/whitney-louchheim",
  "/raymond-ngu",
  "/joshua-miller",
  "/romon-bunch",
  "/stephen-harburg",
  "/pooja-mehta",
  "/maria-nagorski",
  "/joann-shaner",
  "/rebecca-troth",
  "/kyla-woods",
  "/kristen-powell",
  "/sarah-shor",
  "/nick-camillo",
  "/tawana-logan",
  "/robert-barton",
  "/shaliqua-mcknight",
  "/gunita-singh",
  "/eric-huang",
  "/sonia-slone",
];

// Squarespace template leftovers: these return the 404 page on purpose.
const RETIRED = [
  "/testing",
  "/new-page-1",
  "/portfolio-1",
  "/portfolio-1/project-one-f5w4d-4c4lp",
  "/portfolio-1/project-two-ky966-fprak",
  "/portfolio-1/project-three-sng7y-cj8k4",
  "/portfolio-1/project-four-l3zw3-337g8",
  "/portfolio-1/project-five-748cx-gyjf2",
  "/portfolio-1/project-six-6f87e-n6z8k",
  "/policy-advocacy/blog-post-title-one-ffxlm",
  "/policy-advocacy/blog-post-title-two-r5dys",
  "/policy-advocacy/blog-post-title-three-9tb8w",
  "/policy-advocacy/blog-post-title-four-hk59s",
  "/news-updates/2016/fusce-rhoncus-vulputate-ex-eget-lacinia-orci-mr5lb",
  "/news-updates/zgehawtif73zd26hxshw0vbj5y71vn",
  "/news-updates/category/Category+1",
];

const errors = [];
const fail = (message) => errors.push(message);

// The file Cloudflare serves for a path, or null.
function builtFile(path) {
  const candidates = path === "/" ? ["index.html"] : [`${path.slice(1)}.html`, path.slice(1), `${path.slice(1)}/index.html`];
  return candidates.find((file) => existsSync(`${PUBLIC}/${file}`) && !file.endsWith("/")) ?? null;
}

// static/_redirects, as copied into the build.
const redirectsFile = `${PUBLIC}/_redirects`;
if (!existsSync(redirectsFile)) fail("missing public/_redirects");
const redirects = new Map();
for (const line of (existsSync(redirectsFile) ? readFileSync(redirectsFile, "utf8") : "").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [from, to, status] = trimmed.split(/\s+/);
  if (status !== "301") fail(`_redirects: ${from} should be a 301 (got ${status})`);
  if (redirects.has(from)) fail(`_redirects: ${from} is listed twice`);
  redirects.set(from, to);
}

for (const [from, to] of redirects) {
  if (builtFile(from)) fail(`_redirects: ${from} is also a built page, so the redirect would hide it`);
  if (!builtFile(to)) fail(`_redirects: ${from} points at ${to}, which was not built`);
}

for (const url of LIVE_URLS) {
  if (!builtFile(url) && !redirects.has(url)) fail(`live URL ${url} is neither a built page nor a redirect`);
}
for (const url of RETIRED) {
  if (builtFile(url)) fail(`retired URL ${url} was built; take it off RETIRED if that is intended`);
}

// Every sitemap entry must be a built page.
const sitemapPath = `${PUBLIC}/sitemap.xml`;
if (!existsSync(sitemapPath)) fail("missing public/sitemap.xml");
const locations = existsSync(sitemapPath)
  ? [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  : [];
if (!locations.includes(`${SITE}/`)) fail("sitemap is missing the homepage");
for (const location of locations) {
  const path = new URL(location).pathname;
  if (path !== "/" && path.endsWith("/")) fail(`sitemap URL ends in a slash (would redirect): ${location}`);
  if (!builtFile(path)) fail(`sitemap URL has no built page: ${location}`);
}

if (!existsSync(`${PUBLIC}/404.html`)) fail("missing public/404.html");

if (errors.length) {
  console.error(`ROUTE INVENTORY FAILED (${errors.length}):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `Route inventory OK: ${LIVE_URLS.length} live URLs covered (${redirects.size} by redirect), ` +
    `${RETIRED.length} retired, ${locations.length} sitemap URLs built.`,
);
