Create a new full blog post.

Ask the user for:
1. The title (if not already provided as an argument)
2. A short description (1-2 sentences, used in RSS and meta tags — optional)
3. Tags (optional — suggest relevant ones if they're unsure)
4. The post content in markdown (or offer to help draft it)
5. Whether to publish immediately or save as draft (default: draft)

Then:
- Set the date to today
- Generate a slug from the title: lowercase, words separated by hyphens, no special characters, descriptive but concise
- Create the file at src/content/posts/[slug].md with this exact frontmatter structure:

```
---
title: "Post title"
date: YYYY-MM-DD
description: "Short description"
tags: [tag1, tag2]
draft: true
---

Post content here.
```

- Omit the description line entirely if the user doesn't provide one
- Remove `draft: true` only if the user wants to publish immediately
- Commit with message "Add post: [title]"
- Push to GitHub via: export PATH="$PATH:/opt/homebrew/bin" && git ...

Remind the user that footnotes are supported using standard markdown syntax:
- Inline: `some text[^1]`
- Definition: `[^1]: The footnote text.`
