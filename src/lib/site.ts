import { getCollection, type CollectionEntry } from "astro:content";

export const SITE_URL = "https://www.opencityadvocates.org/";
export const SITE_TITLE = "Open City Advocates";
export const SITE_DESCRIPTION =
  "Youth-centered legal defense and holistic advocacy for young people after sentencing in the DC juvenile justice system.";

export const CONTACT = {
  email: "info@opencityadvocates.org",
  phone: "202-678-9001",
  address: "1328 Florida Avenue NW, Second Floor, Washington, DC 20009",
};

// External action links (NeonCRM), verified live 2026-07-15.
export const SUBSCRIBE_URL = "https://opencityadvocates.app.neoncrm.com/subscribe.jsp";
export const DONATE_URL = "https://opencityadvocates.app.neoncrm.com/forms/donation-form";

// Main navigation, in the live site's order. An item with `children` is a dropdown folder.
export interface MenuItem {
  name: string;
  url?: string;
  children?: { name: string; url: string }[];
}

export const MENU: MenuItem[] = [
  { name: "About Us", url: "/" },
  { name: "Our Team", url: "/our-team" },
  { name: "News", url: "/news-updates" },
  {
    name: "Resources",
    children: [
      {
        name: "A Call to Expand Post-Disposition Representation of Youth in the Juvenile Legal System",
        url: "/a-call-to-expand-post-disposition-representation-of-youth-in-the-juvenile-legal-system",
      },
      { name: "Post-Disposition Defense Guide", url: "/post-disposition-defense-guide" },
      { name: "Policy & Advocacy", url: "/policy-advocacy" },
    ],
  },
  { name: "Subscribe", url: SUBSCRIBE_URL },
  { name: "Join Us", url: "/join-us" },
  { name: "Donate", url: DONATE_URL },
];

// Which top-level menu item a page belongs to (underlined in the header).
export function activeMenuName(path: string): string | undefined {
  for (const item of MENU) {
    if (item.url === path) return item.name;
    if (item.children?.some((child) => child.url === path || path.startsWith(child.url + "/"))) return item.name;
  }
  if (path.startsWith("/news-updates")) return "News";
  if (path.startsWith("/join-us")) return "Join Us";
  if (path.startsWith("/policy-advocacy")) return "Resources";
  return undefined;
}

// Bio titles carry credentials for the team list ("Penelope Spain, Esq."); the bio page shows the name alone.
export function shortName(title: string): string {
  return title.split(",")[0].trim();
}

// "12/18/25", as the news list prints dates.
export function numericDate(date: Date): string {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${String(date.getUTCFullYear()).slice(-2)}`;
}

// "DEC 18", as a news post prints its date.
export function postDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase();
}

export type Page = CollectionEntry<"pages">;

// Published pages only: drafts stay out of the build.
export async function pages(): Promise<Page[]> {
  return (await getCollection("pages")).filter((page) => !page.data.draft);
}

// "news-updates/_index" -> "/news-updates"; "_index" -> "/"; "our-team" -> "/our-team".
export function pageUrl(page: Page): string {
  if (page.data.url) return page.data.url;
  const id = page.id.replace(/(^|\/)_index$/, "");
  return id === "" ? "/" : `/${id}`;
}

// A section list page (content/<section>/_index.md) rather than a single page.
export function isSection(page: Page): boolean {
  return page.id.endsWith("_index") && page.id !== "_index";
}

// The section a page belongs to: "news-updates" for news-updates/2023/x, "" at the top level.
export function sectionOf(page: Page): string {
  const parts = page.id.split("/");
  return parts.length > 1 ? parts[0] : "";
}

// The regular pages inside a section (subfolders included), as Hugo's .Pages listed them.
export function sectionPages(all: Page[], section: string): Page[] {
  return all.filter((page) => !isSection(page) && sectionOf(page) === section);
}

// Newest first; undated pages keep a stable order after the dated ones.
export function byDateDesc(list: Page[]): Page[] {
  return [...list].sort((a, b) => {
    const ad = a.data.date?.getTime() ?? 0;
    const bd = b.data.date?.getTime() ?? 0;
    return bd - ad || a.data.title.localeCompare(b.data.title);
  });
}

// Find a page by its URL ("/joshua-miller").
export function findPage(all: Page[], url: string): Page | undefined {
  const wanted = url.replace(/\/+$/, "") || "/";
  return all.find((page) => pageUrl(page) === wanted);
}

// Absolute URL of a page path.
export function permalink(path: string): string {
  return new URL(path.replace(/^\//, ""), SITE_URL).href.replace(/\/$/, path === "/" ? "/" : "");
}

// Dates print in UTC, as Hugo printed them.
export function longDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
