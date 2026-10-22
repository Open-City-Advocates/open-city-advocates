import { pathToFileURL } from "node:url";
import path from "node:path";
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Every page on the site is a Markdown file under content/, laid out the way
// Hugo expected, so editing works the same as before:
//   content/our-team.md                  -> /our-team
//   content/news-updates/_index.md       -> /news-updates (the section list)
//   content/news-updates/the-roots.md    -> /news-updates/the-roots
//   content/_index.md                    -> / (the homepage)
// The id is the file's path without ".md"; src/lib/site.ts turns it into a URL.
// (glob's base must be a file URL on Windows.)
const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: pathToFileURL(path.resolve("content")),
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      // Published date (news posts and the policy archive sort by it).
      date: z.coerce.date().optional(),
      author: z.string().optional(),
      // Team bios: the line shown above the name.
      role: z.string().optional(),
      // true keeps a page out of the build (for example an archived bio).
      draft: z.boolean().default(false),
      // Publish at this path instead of the one the file name gives.
      url: z.string().optional(),
      // Homepage.
      mission: z.string().optional(),
      vision: z.string().optional(),
      // Our Team page.
      layout: z.string().optional(),
      staff: z.array(z.object({ page: z.string(), photo: z.string().optional() })).optional(),
      board: z.array(z.string()).optional(),
      // Policy & Advocacy archive.
      docdate: z.string().optional(),
      by: z.string().optional(),
      doctype: z.string().optional(),
      tags: z.array(z.string()).default([]),
      // Archive entries that live elsewhere link out instead of rendering a page.
      href: z.string().optional(),
    })
    .strict(),
});

export const collections = { pages };
