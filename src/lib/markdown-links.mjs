// Markdown link and image handling, carried over from the Hugo render hooks.
// Runs as a Sätteri hast plugin (Astro 7's default Markdown processor):
//  - links to other sites open in a new tab;
//  - internal page links drop a trailing slash ("/our-team/" -> "/our-team"),
//    so they point at the URL Cloudflare serves instead of a redirect;
//  - images load lazily.

const FILE_EXTENSION = /\.[a-z0-9]+$/i;

export function cleanInternalHref(href) {
  const [, path, rest] = href.match(/^([^?#]*)(.*)$/);
  if (path.length > 1 && path.endsWith("/") && !FILE_EXTENSION.test(path.slice(0, -1))) {
    return path.replace(/\/+$/, "") + rest;
  }
  return href;
}

export function ocaLinksPlugin() {
  return {
    name: "oca-links",
    element: {
      filter: ["a", "img"],
      visit(node, ctx) {
        if (node.tagName === "img") {
          ctx.setProperty(node, "loading", "lazy");
          return;
        }
        const href = node.properties?.href;
        if (typeof href !== "string") return;
        if (href.startsWith("http")) {
          ctx.setProperty(node, "target", "_blank");
          ctx.setProperty(node, "rel", "noopener");
        } else if (href.startsWith("/")) {
          const clean = cleanInternalHref(href);
          if (clean !== href) ctx.setProperty(node, "href", clean);
        }
      },
    },
  };
}
