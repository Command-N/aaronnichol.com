# Isolated Writer previews

This package builds static preview content without Cloudflare credentials, uploads it from trusted `main` code, and removes deployments only after their exact preview branch is absent. Production keeps its existing Cloudflare Git integration. No production content, build settings or dependencies are changed by this package.

## Setup and current gate

- Repository: `Command-N/aaronnichol.com`, trusted branch `main`.
- Preview account: **Writer Preview**, `bb89eed3470bf2a12e60d78e10d0b92a`.
- Direct Upload project: `writer-previews`, `writer-previews.pages.dev`.
- Reserved production branch: `writer-preview-base`; never upload this branch.
- GitHub Environment: `writer-previews`, selected branches/tags policy permitting only branch `main`.
- Environment variables: `CLOUDFLARE_PREVIEW_ACCOUNT_ID` and `CLOUDFLARE_PREVIEW_PROJECT`, matching `preview-config.json`.
- Environment secret: `CLOUDFLARE_PREVIEW_EDIT_TOKEN`, a user token with only Account → Cloudflare Pages → Edit for the specific preview account. GitHub metadata confirms it is saved; the author confirmed that exact scope. MCP cannot independently read token policies and no secret value was retrieved.
- Repository variables: `WRITER_PREVIEW_AUTOMATION_ENABLED=false`, `WRITER_PREVIEW_DELETION_ENABLED=false`.

Stage B setup and Stage C manual workflow/provider validation are complete. PRs #72–74 installed and corrected the package. Exact-revision uploads, static table/image rendering, Environment rejection before steps, historical/alias deletion, evidence recovery, idempotency and a real late upload during branch removal passed. Both automatic flags remain false. Manual cleanup defaults to dry run; explicit deletion requires one exact branch and retained evidence. Writer lifecycle implementation and macOS/iOS app tests remain prerequisites for Stages D/E.

Main's existing no-bypass deletion/force-push rule is unchanged. A separate PR rule has a sole owner exception to preserve Writer's existing direct-main Go Live path. Owner-authenticated workflow/helper edits are trusted and must continue through reviewed PRs by convention; owner review is not enforced by that rule.

## How the whole setup fits together

Read the [operations guide in Writer](https://github.com/Command-N/Writer/blob/dev/docs/features/preview-automation/OPERATIONS.md) for the plain-English overview, architecture diagram, resource/credential map, manual recovery procedure and failed-run email explanations. The [validation record](https://github.com/Command-N/Writer/blob/dev/docs/features/preview-automation/stage-c-validation.json) keeps exact IDs and coverage limits; [FEAT-077](https://github.com/Command-N/Writer/blob/dev/docs/features/FEAT-077-preview-lifecycle-review.md) controls rollout order. These links use the Writer development branch and require access to that repository.

The initial cleanup parser failures ran no jobs and were fixed in #73. The real deletion test then found Cloudflare’s empty inventory uses zero pages, fixed in #74. Recovery #37723676609 and retry #37723757695 passed. Probe #37723032310 deliberately failed because the preview ref was denied access. Stale-build #37723196474 and active-upload race #37723946858 deliberately detected branch removal. Queued cleanup #37724016775 removed the late deployment and verified all five cumulative hash/alias URLs; all-orphans dry run #37724058138 passed. Expected test failures are not evidence of a production fault.

Final isolated inventory is empty and `preview/reliability-20261008` is absent. Test content was never merged. Production/custom-domain and unrelated article browser text matched their baselines; production Git settings were unchanged. Legacy Git-integrated PR/test previews in the original account remain for separately authorized Stage E cleanup. The live race exercised a late arrival before cleanup inventory; arrivals after a saved plan and provider error variants are covered by fake-provider tests.

## Workflows and credential boundaries

1. `writer-preview-build.yml`: resolve an exact revision, build on a separate credential-free runner using Node 22.16.0, `npm ci`, `npm run build`, then save `dist`. Manual upload is opt-in and permitted only on `main`.
2. `writer-preview-upload.yml`: automatic completion handling remains disabled. When enabled, verify source repository, workflow ID/path, successful push, exact branch/revision and current branch HEAD. Privileged jobs check out trusted default-branch code and treat artifacts as bounded static data.
3. `writer-preview-cleanup.yml`: manual dry run, exact-branch deletion and disabled scheduled/delete-event reconciliation. Uploads and cleanup share a non-canceling project queue. Inventory covers every API page. Save immutable cumulative URL evidence before each deletion, recheck branch absence, and require repeated empty inventories plus fresh unavailable hash/alias URLs. A late deployment or a 200 fallback remains pending.
4. `writer-preview-isolation-probe.yml`: manual security test limited to `preview/reliability-*` refs. It deliberately requests the forbidden Environment and **must be rejected before any step runs**. Its single step tests secret presence with an exit status and never prints the secret. Any step execution is a failed isolation test, even if the secret is absent. Never bypass the Environment rejection.

Only trusted upload/cleanup steps receive the write token. Wrangler 4.135.0 is installed into temporary runner tooling storage with scripts disabled; it is not a blog dependency. Static archives cannot contain Workers, Functions, deployment configuration, environment files, links, traversal, duplicate paths or excessive expansion. All actions are official `actions/*` actions pinned to full commits.

Cleanup evidence is retained 90 days and carried forward by reconciliation. Export unresolved records before retention expires. Missing evidence does not establish that historical URLs are unavailable.

## Stage C disposable validation procedure

Keep both automation flags false. Record production and an unrelated article preview as baselines. Use only `preview/reliability-20261008`, created from the approved main revision with a harmless marker article. Build its completed content commit before creating the ref. Do not merge or change the author's unpublished article PR #70.

1. Dispatch `writer-preview-build.yml` on **main** with `preview_branch=preview/reliability-20261008`, `upload=false`. Verify exact commit and artifact, no Environment on the build job and no Cloudflare credential.
2. Repeat with `upload=true`. Record new-account deployment ID, hash URL, alias, exact branch/revision and preview environment. Verify rendering, tables and images. Update the disposable ref atomically without deleting it, upload again and retain both historical URLs.
3. Dispatch `writer-preview-isolation-probe.yml` with its **ref set to the disposable preview branch**. GitHub must reject Environment access before runner/steps execute. Record the denial; stop if any step runs.
4. Delete only the disposable ref. Dispatch cleanup on **main**, that exact branch, `delete_previews=false`. Review the persisted exhaustive target/URL inventory: no production or unrelated preview may appear.
5. After reviewing those targets, run that exact cleanup with `delete_previews=true`. Confirm branch absence, every deployment removed, fresh unavailable hash/alias and marker-article URLs, and unchanged production/unrelated baselines. Resolve force-deletion or fallback behavior before advancing.
6. Retry to prove idempotency/evidence recovery. Exercise queued-before-removal uploads, removal during upload, late deployments, manual orphan reconciliation and a delayed event after rebuilding an active disposable ref. Keep pending state on ambiguity.

Before enabling automation or switching Writer, implement and test durable immutable UUID preview identities, operation generations, independent cleanup persistence, atomic ref updates, exact-commit polling, foreground/relaunch reconciliation and visible persistence errors. Current Writer still has the old preview lifecycle. Do not point it at this account yet.

The original production project's `preview/*` builds remain enabled until the ordered final migration stage. It can therefore still build new branches during this validation; this package does not change its controls or delete its legacy deployments.

## Local verification

Run from the publishing repository root:

```sh
node --test scripts/writer-previews/tests/preview-core.test.mjs
python3 -m unittest discover -s scripts/writer-previews/tests -p 'test_*.py' -v
ruby scripts/writer-previews/tests/test_workflow_policy.rb
node --check scripts/writer-previews/scripts/preview.mjs
git diff --check
```

These standard-library checks validate provider failure/race fixtures, artifact safety, YAML and workflow policy. They do not substitute for the live Stage C tests. No additional linter or application dependency is required.
