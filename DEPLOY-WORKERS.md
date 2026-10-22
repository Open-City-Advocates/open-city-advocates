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

## Cutover from Squarespace

This happens after DNS has already moved to Cloudflare, with the Squarespace
site records still in place.

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
