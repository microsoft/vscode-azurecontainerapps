# Coding Instructions for GitHub Copilot

- Never commit or suggest changes to `main.js` or `gulpfile.ts`.
- Never commit or suggest adding the `@swc/core-linux-x64-gnu` package.
- Before working on Express or Standard compatibility, app creation or deployment, registry credentials and secrets, managed identities, revision drafts or modes, ingress defaults, or optional Log Analytics, read [Express compatibility instructions](instructions/express-compatibility.instructions.md).

## Repository scope

This is the TypeScript VS Code extension for Azure Container Apps, not the Azure
backend or the App Service extension. Start with [AGENTS.md](../AGENTS.md) for
architecture and [scoped instructions](instructions) for subsystem contracts.
Do not import App Service assumptions about slots, Kudu, or site clients into
Container Apps revisions, environments, or image deployment.

## Implementation and bug fixes

- Trace the actual entry point from manifest command/localized label through
  `src/commands/registerCommands.ts`, the command, wizard, helper/client, and
  resulting draft or Azure mutation. Establish the trigger and expected result.
- Make the smallest complete fix at the responsible layer. Reuse shared Azure
  Tools infrastructure instead of creating parallel authentication, resource
  picking, wizard, activity, error-handling, or tree-state frameworks.
- Keep command IDs, argument shapes, context values, menu `when` clauses, and
  configuration declarations aligned. Preserve tree-node unwrapping and
  no-node picker paths where supported. Commands, public APIs, walkthroughs,
  and Copilot callbacks do not all receive the same arguments.
- Use `IActionContext`, `context.ui`, registration wrappers, `AzureWizard`, and
  `src/utils/activityUtils.ts`. Preserve cancellation, confirmations, progress,
  activity output, and temporary tree state. Surface failures through the
  existing error infrastructure; do not add broad catches or successful-looking
  fallbacks. Existing swallowed errors are not a model for new code.
- Use `src/utils/azureClients.ts` and `createSubscriptionContext` for the chosen
  resource. Preserve subscription, tenant, cloud, resource group, environment,
  app, revision, replica, and container identity through downstream operations.
  The local preview client intentionally overrides the API version; do not
  spread that policy to unrelated SDK clients.
- Do not assume every client supports every cloud. The Log Analytics query
  helper is explicitly public-cloud-specific and the ACR data-plane helper uses
  the public-cloud audience. Preserve supported behavior and investigate the
  actual client/audience before claiming sovereign-cloud compatibility.
- Distinguish app configuration mutations from revision-template drafts.
  Preserve unrelated envelope properties and existing secrets/registry entries;
  normal app reads do not return secret values. Follow
  [revision/configuration guidance](instructions/revisions-and-configuration.instructions.md).
- Use `vscode.Uri`, Node `path` helpers, and the existing workspace/setting
  utilities. Preserve multi-root and resource-scoped settings; do not resolve
  every project against the first workspace folder or the extension host's cwd.
- Keep the compiler's existing null/unused checks and type-only import style.
  Prefer shared interfaces and explicit guards over new `any` or unchecked
  casts; the repository is not configured with full TypeScript `strict` mode.
- Localize new user-facing source strings using `src/utils/localize.ts`.
  Manifest strings use `%key%` references and `package.nls.json`. Follow existing
  localization patterns on the changed UI surface.

## Sensitive data and lifecycle

- Keep secret/environment-variable values, `.env` contents, registry passwords,
  log-stream tokens, SAS/upload URLs, and raw customer logs out of telemetry and
  new diagnostic errors/output. Preserve `valuesToMask`, password inputs, and
  `maskUserInfo` paths. Do not copy real credentials into fixtures.
- Deployment API results can contain registry credentials; do not serialize the
  whole result into telemetry, output, or saved workspace settings. Explicit
  user-facing secret display is not permission to log or reuse its payload.
- Existing startup diagnostics can attach runtime logs to activity attributes.
  Treat that as a sensitive, intentional boundary, not permission to forward
  logs, secrets, or whole resource envelopes to new chat prompts/services.
- Dispose new event listeners, panels, stream listeners, timers, cancellation
  resources, and providers with their owner. Preserve duplicate-stream
  detection, stop/abort behavior, and cleanup of temporary deployment archives.
- Refresh the affected hierarchy after successful mutations using existing
  `ext.state` notifications/provider refresh paths. Draft writes must also
  notify filesystem consumers. Do not discard drafts or report completion
  before the corresponding deployment succeeds.

## Build and verification

| Exact command | Purpose |
| --- | --- |
| `npm run build:esbuild` | Bundle extension/webview code through `esbuild.mjs` and shared engineering configuration. |
| `npm run build:check` | Type-check with `tsgo --noEmit`; this does not emit a runnable bundle. |
| `npm run build` | Runs `npm run build:esbuild && npm run build:check` sequentially. |
| `npm run lint` | Runs `eslint --max-warnings 0`. |
| `npm test` | Runs `vscode-test` using `.vscode-test.mjs` and the shared Azure Tools test configuration. |
| `npm run package` | Runs `vsce package --githubBranch main --no-dependencies`; packaging is not a routine test. |

- Follow `.nvmrc` and `package-lock.json`; use `npm ci` when a dependency restore
  is needed. Do not replace shared engineering configuration or install new
  tooling to hide an unrelated environment problem.
- Add focused regression coverage for triggering and important adjacent cases.
  Tests use Mocha/assert and shared Azure Tools action/UI helpers. Run the
  smallest relevant checks and distinguish bundling, type-checking, hosted
  tests, and live-Azure validation. See
  [testing guidance](instructions/testing.instructions.md) for gates and costs.
- `.github/workflows/main.yml` delegates to the Azure Tools reusable jobs
  workflow. `.config/build.yml` and `.config/release.yml` use shared Azure DevOps
  templates. Inspect the exact failing run/job before changing build code;
  the complete pipeline implementation is not local to this repository.
- Do not hand-edit generated `dist/`, `out/`, `node_modules/`, `.vscode-test/`,
  VSIX files, or test-result artifacts. The tracked loader restriction above
  still applies; it is not a generated file to regenerate.
- Update directly affected documentation. Documentation-only changes need path,
  link, instruction-frontmatter, and whitespace checks, not product builds or
  dependency installation.

## Pull request descriptions

- Keep PR descriptions brief: an issue-closing line, a human-readable reason,
  and labeled before/after screenshots. Use this compact format:

  ```markdown
  Fixes #<issue>

  <One or two lines explaining why this change was needed.>

  Before (base): <real screenshot reproducing the bug or missing feature>
  After (candidate): <real screenshot showing the fix or feature working>
  ```

- Use `Fixes owner/repo#<number>` for cross-repository issues. Link only issues
  actually addressed; if none exists, write `Fixes: N/A (no linked issue)`
  rather than inventing an issue number.
- Capture real screenshots from the baseline without the PR changes and from
  the candidate running the same scenario. Embed or attach them; do not leave
  local file paths in the published description. Redact sensitive data under
  the rules above.
- For docs-only or nonvisual changes, explicitly label screenshot evidence
  `N/A` and explain why. If applicable verification is blocked, state the
  blocker and what remains unverified; do not substitute mocks, fabricated
  screenshots, or an unexecuted plan for actual UI evidence.

## Pull request review

- Validate the behavior before writing the review: first run the scenario on
  the base without the PR changes and screenshot the bug or missing feature;
  then run the same scenario on the candidate and screenshot the fix or
  feature working. Record the base/candidate revisions and ensure each running
  bundle matches its revision. Preserve unrelated edits when preparing runs.
- Keep inputs, configuration, and target context comparable; isolate or reset
  state between runs when necessary. Follow the authorization and cleanup
  rules in [testing guidance](instructions/testing.instructions.md) for
  live Azure validation.
- Keep the public review similarly brief: labeled baseline/candidate
  screenshots and one human-readable line per finding. Attach a real
  screenshot of any reported bug, not just the successful candidate path.
  Keep detailed investigation and test output in supporting evidence rather
  than expanding the public comment.
- Apply the same explicit `N/A` treatment to docs-only/nonvisual changes.
  Provide relevant source or test evidence instead of inventing UI evidence;
  distinguish a blocked visual check from a verified result.

- Report concrete regressions introduced by the diff, not style preferences,
  speculative Azure behavior, or unrelated existing issues. Follow callers,
  wizard ordering, and shared contracts before declaring a bug.
- Include severity, a realistic trigger, and observable user impact in the
  finding's single human-readable line; anchor it to the smallest useful
  changed line range. Check why existing guards/tests do not prevent the bug
  and identify the smallest viable fix in supporting evidence.
- Prioritize wrong-resource mutations, lost secrets/settings/containers, draft
  data loss, broken deployment/API contracts, credential exposure, and missed
  refresh/cancellation/cleanup.
- Check only relevant adjacent paths: single/multiple revision mode; live/draft
  template; first/later container index; existing/new resources; existing image
  versus remote ACR build; identity versus Docker login; tree/palette/API/Copilot
  entry; multi-root settings; empty/stale/partial Azure responses; and failure
  after partial resource creation.
- State uncertainty and material coverage gaps. Do not claim skipped tests,
  remote checks, or live-Azure verification ran when they did not.
