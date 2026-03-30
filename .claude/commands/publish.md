Publish a draft post to the blog.

The user will provide a post name, title, or partial slug.

Steps:

1. Search src/content/drafts/ for a filename matching what the user provided.
   - If multiple files match, list them and ask the user to clarify.
   - If no files match, list all files in src/content/drafts/ so the user can pick.

2. Read the file. Show the user: "Publishing: [title] ([type]) — is that right?"
   where [type] is "link post" if there is a `url` field with a non-empty value, or "post" if not.
   Wait for confirmation before proceeding.

3. Determine the destination:
   - Frontmatter has a `url` field with a non-empty value → src/content/links/[slug].md
   - No `url` field, or `url` is empty → src/content/posts/[slug].md
   The slug is the draft filename lowercased with spaces replaced by hyphens, without the .md extension.

4. Prepare the file content:
   - Replace the `date:` value with the current datetime in ISO 8601 format with timezone offset (e.g. 2026-03-30T14:35:00+11:00). Get the current time using: date +"%Y-%m-%dT%H:%M:%S%z" (then insert a colon in the timezone offset to make it RFC 3339 compliant, e.g. +1100 → +11:00).
   - Remove the `draft: true` or `draft: false` line entirely if present
   - If the frontmatter contains `tags:` with no value (bare key or null), replace with `tags: []`
   - Leave all other frontmatter fields as-is

5. Write the prepared content to the destination path.
   Delete the original file from src/content/drafts/.

6. Run the following git and GitHub steps using `export PATH="$PATH:/opt/homebrew/bin"` prefix:

   a. Create and switch to a new branch:
      git checkout -b publish/[slug]

   b. Stage the new file:
      git add src/content/links/[slug].md  (or posts/)

   c. Commit:
      git commit -m "Publish: [title]"

   d. Push the branch:
      git push -u origin publish/[slug]

   e. Create PR and enable auto-merge:
      gh pr create --title "Publish: [title]" --body ""
      gh pr merge --auto --squash

7. Report the PR URL to the user. Tell them the post will go live once the PR merges automatically.

Notes:
- Do not push to main directly — always go through the branch
- The draft file is gitignored so only the destination file needs to be staged
- If any step fails, report the error clearly and stop
