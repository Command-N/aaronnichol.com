Publish a draft post.

The user will provide a post name, title, or partial slug.

Steps:
1. Search src/content/drafts/ for a filename matching what the user provided
2. Read the file and confirm with the user: "Publishing: [title] — is that right?"
3. Determine the type:
   - If the frontmatter has a `url` field → it's a link post → move to src/content/links/
   - If no `url` field → it's a full post → move to src/content/posts/
4. Copy the file to the correct folder (remove from drafts, create in destination)
5. Commit with message "Publish: [title]"
6. Push to GitHub via: export PATH="$PATH:/opt/homebrew/bin" && git ...

If multiple files match, list them and ask the user to clarify.
If no files match, list all files in src/content/drafts/ so the user can pick.
