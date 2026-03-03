# CLAUDE.md — Project Context

## What this is
A personal link blog built with Astro, designed to establish credibility in the agentic AI / enterprise technology space. The author is pivoting from a consulting director role in tech managed services toward launching their own product or service business. The blog is the first step in a credibility-building strategy.

## Design intent
The design is directly inspired by **Simon Willison's blog** (simonwillison.net) and **John Gruber's Daring Fireball** (daringfireball.net). These are the reference points for any design decisions:

- **Link blog format**: Two content types. "Links" have titles that point OUTWARD to the source URL, with a small ✦ permalink to the commentary. "Posts" are standard blog entries where the title links to the post's own page. Both appear in a single chronological feed on the homepage.
- **Typography-first**: The site's personality comes from good typography and generous whitespace, not from colour, illustration, or visual complexity. Currently using Source Serif 4 (body), Inter (headings/UI), JetBrains Mono (code).
- **Warm, not cold**: The accent colour is warm amber (#b45309), not the typical blue. The background is warm stone (#fafaf9), not pure white.
- **Minimal chrome**: No sidebar, no hero images, no cards, no grid layouts. Just a header, content, and footer. The content width is 640px for optimal reading comfort.
- **No JavaScript in output**: The built site is pure static HTML/CSS. Keep it that way unless there's a very compelling reason.

## Content model
- `src/content/posts/` — Full blog posts. Frontmatter: title, date, description (optional), tags, draft.
- `src/content/links/` — Link posts (Gruber/Willison style). Frontmatter: title, url, date, tags, draft. The `url` field is where the title links to.
- Both are markdown files. The filename becomes the URL slug.

## What NOT to do
- Don't add complexity unless asked. No dark mode toggle, no search, no tag pages, no analytics — until specifically requested.
- Don't change the fundamental two-content-type model. The distinction between posts and links is core to the identity.
- Don't make it look "modern" in the generic sense — no card layouts, no gradients, no rounded-corner everything, no hero sections. It should look like a well-set page of text.
- Don't add client-side JavaScript without being asked.
- Don't use Tailwind. The styles are in plain CSS with custom properties, and that's intentional.

## Technical notes
- Astro 5.x, static output mode
- Content collections defined in `src/content.config.ts`
- Single layout in `src/layouts/Base.astro`
- RSS feed at `src/pages/rss.xml.js` combines both content types
- Google Fonts loaded via `<link>` in the layout head
- Deployed to Cloudflare Pages (build command: `npm run build`, output: `dist`)

## Voice and tone (for content assistance)
The author's writing style is analytical, direct, and conversational. Think "sharp colleague explaining something over coffee" not "consultant writing a deliverable." First person, concrete observations, no hedging language, no bullet-point listicles. Australian English spelling (organise, colour, analyse).

## Planned evolution
These may be requested in future sessions:
- Custom domain setup and Cloudflare Pages deployment
- Buttondown email newsletter integration via RSS
- Tag index pages
- Search (likely a simple client-side search over a JSON index)
- Custom fonts (self-hosted rather than Google Fonts)
- Open Graph / social sharing metadata
- Potentially a "TIL" (Today I Learned) section like Willison's
