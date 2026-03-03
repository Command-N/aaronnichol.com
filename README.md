# Your Blog

A minimal link blog built with [Astro](https://astro.build), inspired by the formats of Daring Fireball and Simon Willison.

## Features

- **Two content types**: Full posts (title links to own page) and link posts (title links outward, with ✦ permalink)
- **Combined feed**: Both types appear in a single chronological stream on the homepage
- **RSS feed**: Combined feed at `/rss.xml` for subscribers
- **Clean URLs**: `/posts/my-post-title` and `/links/my-link-title`
- **Minimal design**: Source Serif 4 for body, Inter for headings, warm amber accent color
- **Zero JavaScript**: Static HTML output, fast everywhere

## Quick Start

```bash
npm install
npm run dev      # Local dev server at localhost:4321
npm run build    # Build static site to ./dist
npm run preview  # Preview built site
```

## How to Write

### Full Post
Create a file in `src/content/posts/`:

```markdown
---
title: "Your post title"
date: 2026-03-03
description: "Optional description for SEO and RSS"
tags: [ai, agents]
---

Your post content in markdown. The title on the homepage
links to the post's own page.
```

### Link Post (Gruber/Willison style)
Create a file in `src/content/links/`:

```markdown
---
title: "Title of the thing you're linking to"
url: "https://example.com/the-article"
date: 2026-03-03
tags: [ai, agents]
---

Your commentary on the linked piece. The title on the
homepage links OUT to the source URL. A small ✦ symbol
provides the permalink to your commentary.
```

### Drafts
Add `draft: true` to any post's frontmatter to exclude it from the build.

## Customisation

### Change your name and description
Edit these files:
- `src/layouts/Base.astro` — `siteTitle` and `pageDescription` variables
- `src/pages/rss.xml.js` — `title` and `description` in the rss() call
- `src/pages/about.astro` — Your bio

### Change fonts
Edit `src/layouts/Base.astro` (the Google Fonts link) and `src/styles/global.css` (the `--font-body`, `--font-sans`, `--font-mono` variables).

### Change colors
Edit the CSS variables at the top of `src/styles/global.css`. The key ones:
- `--color-link` / `--color-link-hover` — Link color (currently warm amber)
- `--color-bg` — Background
- `--color-text` — Body text

### Change the site URL
Edit `astro.config.mjs` — set the `site` property to your domain.

## Deploying to Cloudflare Pages

1. Push this repo to GitHub
2. In the Cloudflare dashboard, go to Workers & Pages → Create → Pages
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 20 (set in Environment Variables as `NODE_VERSION=20`)
5. Deploy

Your site will be live at `your-project.pages.dev`. Add your custom domain in the Cloudflare Pages settings.

## Project Structure

```
src/
├── content/
│   ├── posts/          # Full blog posts (title links to self)
│   └── links/          # Link posts (title links outward)
├── layouts/
│   └── Base.astro      # Shared HTML layout
├── pages/
│   ├── index.astro     # Homepage (combined feed)
│   ├── about.astro     # About page
│   ├── rss.xml.js      # RSS feed
│   ├── posts/
│   │   └── [slug].astro  # Individual post pages
│   └── links/
│       └── [slug].astro  # Individual link permalinks
└── styles/
    └── global.css      # All styles
```

## Email Newsletter

For email subscriptions, set up [Buttondown](https://buttondown.com):
1. Create a Buttondown account
2. In Settings → RSS, add your blog's RSS feed URL
3. Buttondown will automatically send new posts to subscribers
4. Add a subscribe link to your site's nav or about page
