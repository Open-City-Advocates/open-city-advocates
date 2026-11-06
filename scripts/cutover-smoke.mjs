// Cutover-day smoke test (DEPLOY-WORKERS.md, "Cutover from Squarespace", step 3).
//
//   node scripts/cutover-smoke.mjs                      # the live domain
//   node scripts/cutover-smoke.mjs https://open-city-advocates.joshua-ad8.workers.dev
//
// Checks the pages the cutover list names, every page in the site's own
// sitemap, the Neon donate and subscribe links, the PDFs and the 404 page.
// Against www.opencityadvocates.org it also checks that the Worker (not
// Squarespace) answers and that the apex and http:// redirect to https://www.
// Exits 1 if anything fails.

const base = (process.argv[2] ?? "https://www.opencityadvocates.org").replace(/\/$/, "");
const isLiveDomain = new URL(base).hostname === "www.opencityadvocates.org";
const failures = [];
let passed = 0;

function check(ok, label, detail = "") {
  if (ok) passed++;
  else failures.push(`${label}${detail ? ` (${detail})` : ""}`);
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? ` (${detail})` : ""}`);
}

async function get(url, redirect = "follow") {
  try {
    const res = await fetch(url, { redirect, headers: { "user-agent": "oca-cutover-smoke" } });
    return { status: res.status, location: res.headers.get("location"), server: res.headers.get("server") ?? "",
             type: res.headers.get("content-type") ?? "", url: res.url, body: redirect === "follow" ? await res.text() : "" };
  } catch (error) {
    return { status: 0, error: error.cause?.code ?? error.message, location: null, server: "", type: "", url, body: "" };
  }
}

// A page must load at its own address: a redirect elsewhere (say, every path to
// the homepage) is a failure, not a pass.
// The page's canonical tag must name the same path, so a rewrite serving the
// homepage (or any other page) at this address fails too.
const trim = (p) => p.replace(/\/$/, "");
const canonical = (body) => body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const landedAt = (res, path) => res.url && new URL(res.url).origin === new URL(base).origin
  && trim(new URL(res.url).pathname) === trim(path)
  && canonical(res.body) !== undefined && trim(new URL(canonical(res.body)).pathname) === trim(path);

async function page(path, label = path) {
  const res = await get(base + path);
  check(res.status === 200 && res.type.startsWith("text/html") && landedAt(res, path), `${label} serves a page`,
        res.error ?? `${res.status} ${res.type} at ${res.url}`);
  return res;
}

async function redirects(from, to, label) {
  const res = await get(from, "manual");
  const target = res.location && new URL(res.location, from).href;
  check(res.status === 301 && target === to, label, res.error ?? `${res.status} -> ${target}`);
}

// The pages DEPLOY-WORKERS.md names.
const home = await page("/", "homepage");
if (isLiveDomain) check(/cloudflare/i.test(home.server), "the Worker answers, not Squarespace", `server: ${home.server}`);
check(home.body.includes("/css/main.css"), "homepage is the Astro build");
const css = await get(base + "/css/main.css");
check(css.status === 200 && css.type.includes("css") && css.body.includes(".hero"), "stylesheet loads", css.error ?? `${css.status} ${css.type}`);
await page("/our-team");
await page("/penelope-spain", "a bio");
await page("/news-updates/our-2025-annual-report", "a news post");
await page("/policy-advocacy/2023-act-now-testimony", "a testimony");
await redirects(base + "/about-us", base + "/", "/about-us redirects home");

// Every page in the site's own sitemap.
const sitemap = await get(base + "/sitemap.xml");
const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
check(locs.length > 40, "sitemap lists the site", `${locs.length} pages`);
const bad = [];
for (const path of locs) {
  const res = await get(base + path);
  if (res.status !== 200 || !landedAt(res, path)) bad.push(`${path} ${res.status} at ${res.url}`);
}
check(bad.length === 0, `all ${locs.length} sitemap pages load`, bad.join(", "));

// Donate and Subscribe go to Neon, and Neon answers.
for (const [label, needle] of [["Donate", "neoncrm.com/forms/donation-form"], ["Subscribe", "neoncrm.com/subscribe.jsp"]]) {
  const href = home.body.match(new RegExp(`href="(https://[^"]*${needle.replace(/[./]/g, "\\$&")}[^"]*)"`))?.[1];
  check(Boolean(href), `${label} link on the homepage`);
  if (href) {
    const res = await get(href);
    check(res.status === 200, `${label} (Neon) loads`, res.error ?? String(res.status));
  }
}

// PDFs, including the old Squarespace /s/ address.
for (const path of ["/A-Call-to-Expand-Post-Dispo-Representation.pdf", "/s/A-Call-to-Expand-Post-Dispo-Representation.pdf",
                    "/docs/2026-07-01-dcmr-csrh-joint-letter.pdf"]) {
  const res = await get(base + path);
  check(res.status === 200 && res.type.includes("pdf"), `${path} is a PDF`, res.error ?? `${res.status} ${res.type}`);
}

// Unknown address: the site's 404 page with a 404 status.
const missing = await get(base + "/no-such-page-cutover-smoke");
check(missing.status === 404 && missing.body.includes("/css/main.css"), "unknown address gets the 404 page", `${missing.status}`);

// Apex and plain http go to https://www, path kept.
if (isLiveDomain) {
  await redirects("https://opencityadvocates.org/our-team", `${base}/our-team`, "apex redirects to www");
  await redirects("http://www.opencityadvocates.org/our-team", `${base}/our-team`, "http redirects to https");
}

console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? `:\n  ${failures.join("\n  ")}` : ""}`);
process.exitCode = failures.length ? 1 : 0;
