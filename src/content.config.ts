import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    mediaType: z.enum(['video', 'talk', 'vlog', 'review']),
    url: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { knowledge, media };
