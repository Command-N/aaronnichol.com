import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Keep entry ids as the original file name (e.g. "my-post.md") so URLs stay the same.
const loader = (base: string) =>
  glob({ pattern: '**/*.md', base, generateId: ({ entry }) => entry });

const posts = defineCollection({
  loader: loader('./src/content/posts'),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const links = defineCollection({
  loader: loader('./src/content/links'),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const drafts = defineCollection({
  loader: loader('./src/content/drafts'),
  schema: z.object({
    title: z.string(),
    url: z.string().url().optional(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts, links, drafts };
