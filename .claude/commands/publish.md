Publish a post or link that is currently set to draft.

The user will provide a post name, title, or partial slug.

Steps:
1. Search src/content/posts/ and src/content/links/ for a filename matching what the user provided
2. Read the file and confirm with the user: "Publishing: [title] — is that right?"
3. Remove the `draft: true` line from the frontmatter
4. Commit with message "Publish: [title]"
5. Push to GitHub via: export PATH="$PATH:/opt/homebrew/bin" && git ...

If multiple files match, list them and ask the user to clarify which one.
If no files match, list all current drafts so the user can pick.
