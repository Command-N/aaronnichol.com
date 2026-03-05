Create a new link post for the blog.

Ask the user for:
1. The URL they're linking to (if not already provided as an argument)
2. Their commentary (can be a few sentences to a few paragraphs, in markdown)
3. Tags (optional — suggest relevant ones based on the URL/content if they're unsure)
4. Whether to publish immediately or save as draft (default: draft)

Then:
- Set the date to today
- Generate a slug from the title: lowercase, words separated by hyphens, no special characters, keep it short (3-5 words max)
- Create the file at src/content/links/[slug].md with this exact frontmatter structure:

```
---
title: "Title of the linked article"
url: "https://..."
date: YYYY-MM-DD
tags: [tag1, tag2]
draft: true
---

Commentary here.
```

- Remove `draft: true` only if the user wants to publish immediately
- Commit with message "Add link: [title]"
- Push to GitHub via: export PATH="$PATH:/opt/homebrew/bin" && git ...
