import { pageUrl, pages, permalink } from "../lib/site";

// Every published HTML page, at the URL Cloudflare serves it from.
export async function GET() {
  const urls = (await pages())
    .filter((page) => !page.data.href)
    .map(pageUrl)
    .sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)))
    .map(permalink);
  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
