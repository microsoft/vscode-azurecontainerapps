---
applyTo: "test/**/*.ts,test/**/*.json,test/**/*.code-workspace,.vscode-test.mjs,.vscode/launch.json,.vscode/tasks.json,esbuild.mjs,eslint.config.mjs,tsconfig.json,package.json,package-lock.json,.github/workflows/*.yml,.config/*.yml"
---

# Verification and test boundaries

- Exact package scripts and repository-wide rules are in
  [the main instructions](../copilot-instructions.md). Use `.nvmrc` and the
  lockfile; do not add a test runner or install dependencies solely for docs.
- `esbuild.mjs` delegates to `@microsoft/vscode-azext-eng/esbuild` and adds the
  `src/webviews/index.tsx` entry. Bundling and `tsgo --noEmit` type-checking are
  distinct checks; changing JSX/controller interfaces may require both.
- `.vscode-test.mjs` re-exports shared `azExtTestConfig`. `npm test` is a VS Code
  extension-host run, not plain Node Mocha. Inspect shared runner capabilities
  before inventing flags or claiming an individual-test selector exists.
- `test/global.test.ts` initializes extension state through the test API and
  uses `TestUserInput` so unexpected prompts fail. Reuse the existing action,
  telemetry, and UI test helpers; restore modified workspace settings and stubbed
  behavior so tests do not depend on execution order.
- Focused local examples include `test/imageNameUtils.test.ts`,
  `test/validateUtils.test.ts`, and `test/ingress/`. Cover triggering inputs and
  relevant null/empty/failure/cancellation cases, not just happy-path snapshots.
- Live-Azure suites under `test/nightly/deployWorkspaceProject/` call
  `this.skip()` unless `longRunningTestsEnabled` is true. Local opt-in is
  `AzCode_EnableLongRunningTestsLocal`; empty, `0`, and `false` disable it.
  Remote enablement comes from `FC_SERVICE_CONNECTION_NAME` or
  `AzCode_UseAzureFederatedCredentials` as implemented in `test/global.test.ts`.
  Do not describe a passing default run as live deployment coverage.
- `test/nightly/global.nightly.test.ts` logs in through Azure Resources, chooses
  a subscription, and tracks resource groups for teardown. These tests can
  create billable resources; obtain appropriate authorization and use isolated
  test resources. Preserve resource-group tracking and inspect teardown errors;
  its deletion calls are initiated without awaiting each deletion's completion.
- Scenario selection in
  `test/nightly/deployWorkspaceProject/scenarios/testScenarios.ts` differs for
  local long-running runs: managed-identity/role-assignment scenarios are added
  only for local opt-in because the remote test subscription lacks privileges.
  Check selected scenarios, skips, credentials, region, and result artifacts
  before claiming coverage. API tests also cover a containerized Functions
  project; that does not make this the Functions extension.
- `.vscode/launch.json` supplies extension/test debugging configurations and
  optional sibling Docker/host-extension launch paths. Those sibling checkouts
  are developer setup, not guaranteed dependencies of a fresh clone.
- GitHub Actions delegates to the shared Azure Tools jobs workflow; Azure
  DevOps build/release definitions also extend external templates. Read the
  failing run/job and shared configuration before changing local scripts.
  Do not infer the full test matrix from the local workflow name.
- For documentation-only changes, check referenced paths/relative links,
  scoped instruction `applyTo` frontmatter against real files, the final diff,
  and whitespace. Report material unavailable coverage without claiming a
  product build or Azure deployment.
