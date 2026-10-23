# Cloudflare Workers deployment

**Status (October 2026): not live yet.** The site deploys to the Worker's
workers.dev address for review. The domain still serves Squarespace until the
cutover (planned for Tuesday, Nov 17, 2026).

Repo side: `wrangler.jsonc`, `package.json`, `.node-version`, and
`static/_redirects`. There is no Worker script; Cloudflare serves the build
output directly.

## Cloudflare dashboard settings

Create the Worker from this repo (Workers & Pages → Create → Import a
repository). Then, in the Worker → Settings → Build:

| Setting | Value | Why |
|---|---|---|
| Build command | `npm run build` | Runs `astro build`, then the route check. |
| Deploy command | `npx wrangler deploy` (default) | Reads `wrangler.jsonc` from the repo root. |
| Root directory | *(leave blank)* | The config lives at the repo root. |
| Build watch paths | *(leave blank)* | **See below.** |
| Build variables | *(none needed)* | Node comes from `.node-version`. |

The Worker's name in the dashboard must match `"name": "open-city-advocates"`
in `wrangler.jsonc`, or the build fails before deploying.

### Leave build watch paths empty

Learned on the YJP site: setting "Include paths" to `./public` (copied from
`"directory": "./public"` in `wrangler.jsonc`) silently skips every
automatic deploy. `public/` is the build output and is in `.gitignore`, so no
push ever touches it. If a push doesn't produce a build, check this field
first.

### Node version

Astro 7 needs Node 22.22 or newer. Cloudflare's build image reads
`.node-version` (24). An older Node fails in `astro build` with an engine
error, so check the build log if a build fails early.

## How addresses are served

Astro writes each page as a flat file (`our-team.html`).
`"html_handling": "auto-trailing-slash"` serves it at `/our-team` with a 200,
the address style Squarespace used, and sends `/our-team/` and
`/our-team.html` there with a redirect. Unknown paths get `404.html` with a
404 status (`"not_found_handling": "404-page"`). `static/_redirects` handles
retired Squarespace addresses with 301s.

Check all of this locally with `npm run build && npm run preview`.

## Before the cutover: move DNS to Cloudflare

Checked 2026-10-22: `opencityadvocates.org` is **not** on Cloudflare. Its
nameservers are `ns1/ns2.greengeeks.net`; `www` is a CNAME to
`ext-cust.squarespace.com` and the apex points at Squarespace's four A records.
Custom Domains on a Worker need the zone on Cloudflare, so this comes first:

1. In the Cloudflare dashboard (the account `wrangler whoami` shows), add
   `opencityadvocates.org` as a site (Free plan is enough). Cloudflare scans
   the current records; check the import against the GreenGeeks DNS inventory
   and add anything it missed. **Every MX, TXT (SPF, DKIM, DMARC, site
   verifications) and CNAME record must be there before the nameservers
   change**, or mail to `@opencityadvocates.org` breaks. Leave the Squarespace
   `www` CNAME and apex A records in place (DNS-only, grey cloud) so the
   Squarespace site keeps serving.
2. At the registrar, change the nameservers to the two Cloudflare assigns.
   Wait for the zone to show **Active** (minutes to a day). Nothing visible
   changes: the same records now answer from Cloudflare.
3. Only then do the cutover below.

## Cutover from Squarespace

With the zone active on Cloudflare and the Squarespace records still in place:

1. In the Worker → Settings → Domains & Routes, add `www.opencityadvocates.org`
   as a Custom Domain. If Cloudflare refuses because a record already exists
   for that name, delete the Squarespace `www` record (its value is in the DNS
   inventory) and add the Custom Domain right away; the gap is seconds.
2. Add `opencityadvocates.org` (the apex) as a Custom Domain the same way, and add a
   Redirect Rule (Rules → Redirect Rules) sending the apex to
   `https://www.opencityadvocates.org` with the path kept, as a 301. The live
   site's canonical address is `www`.
3. Smoke-test: the homepage, `/our-team`, a bio, a news post, a testimony,
   `/about-us` (redirects home), Donate and Subscribe (Neon), the PDFs, and an
   unknown address (404 page).
4. Once the domains are live and checked, set `"workers_dev": false` in
   `wrangler.jsonc` so only one copy of the site is public.

**Rollback:** remove the two Custom Domains and restore the Squarespace
records from the DNS inventory (DNS-only). The Squarespace site stays
available until the plan is canceled in January.

## What the Worker cannot replace

Squarespace hosted two kinds of forms: "Request Access" on the Defense Guide
page and a contact form on each staff bio. The static site shows the same
forms, but submitting one opens the visitor's email app with the fields
addressed to `info@opencityadvocates.org` (see README.md). The homepage
video was a Squarespace-hosted MP4; the site embeds OCA's YouTube upload of the
same film, "20 Years of Open City Advocates", instead. Everything else on the
Squarespace site (every page in its sitemap, every image, PDF and embed) is
served by the Worker or redirected; `scripts/check-route-inventory.mjs`
checks the addresses on every build.
