# Azure Container Apps extension architecture

Use [.github/copilot-instructions.md](.github/copilot-instructions.md) for
implementation, verification, and review rules. Subsystem contracts live in
[.github/instructions](.github/instructions).

## Follow a user action

`package.json` contributions and `package.nls.json` labels ->
`src/commands/registerCommands.ts` -> command and wizard steps ->
Azure Tools helpers or `src/utils/azureClients.ts` ->
ARM operation or local revision draft -> tree state, activity/output, and tests.

## Code ownership map

| Area | Start here | Boundary |
| --- | --- | --- |
| Activation | `src/extension.ts`, `src/extensionVariables.ts`, `src/commands/api/createContainerAppsApiProvider.ts` | Registers shared extension variables, commands, revision-draft filesystem, and the Azure Resources API handshake. The tracked loader `main.js` measures bundle load time; do not modify it. |
| Resource explorer | `src/tree/ContainerAppsBranchDataProvider.ts`, `src/tree/ManagedEnvironmentItem.ts`, `src/tree/ContainerAppItem.ts` | The rich hierarchy is environment -> app -> template children or revisions, plus configuration and logs. `ext.state` wraps items with operation state. |
| Standalone app group | `src/tree/ContainerAppResourceItem.ts`, `src/commands/revealInEnvironment.ts` | Flat app nodes use a distinct `#flat` tree ID and reveal the rich environment hierarchy; their tree IDs are not ARM resource IDs. |
| Azure clients and resource picking | `src/utils/azureClients.ts`, `src/utils/pickItem/`, `src/utils/getResourceUtils.ts` | Shared Azure Tools factories and subscription contexts own authentication; local helpers select the appropriate app, environment, revision, or container. |
| Create resources | `src/commands/createContainerApp/`, `src/commands/createManagedEnvironment/`, `src/commands/EXECUTE_PRIORITY.md` | List steps inject create/update subwizards. Environment creation coordinates Log Analytics and provider/location requirements. |
| Workspace deployment | `src/commands/deployWorkspaceProject/` | Resolves workspace/tree configuration, migrates saved settings, coordinates creation/build/deploy, and returns deployment results. |
| Images and registry access | `src/commands/deployContainerApp/`, `src/commands/deployImage/`, `src/commands/image/`, `src/commands/registryCredentials/` | Existing images versus remote ACR builds; environment identity/AcrPull versus Docker login; startup verification is separate from build and ARM completion. |
| Revisions and configuration | `src/commands/revision/`, `src/commands/revisionDraft/`, `src/utils/revisionDraftUtils.ts`, `src/commands/updateContainerApp.ts` | Revision templates are edited through an in-memory filesystem; app-level configuration and secrets have different mutation paths. |
| Configuration UI | `src/tree/configurations/`, `src/tree/containers/`, `src/tree/scaling/`, `src/tree/revisionManagement/` | Ingress/secrets are app configuration; containers/environment variables/scaling participate in revision templates and draft editability rules. |
| Logs and portal actions | `src/commands/logStream/`, `src/tree/LogsGroupItem.ts`, `src/commands/openConsoleInPortal.ts` | Revision/replica/container selection, authenticated streaming, and portal links; the console action opens the portal, not an extension-owned exec/debug tunnel. |
| Confirmation UI and Copilot | `src/webviews/`, `src/commands/copilot/` | React/Fluent UI views and extension-side controllers coordinate wizard confirmation, edit/back/cancel state, and Copilot input. |
| Workspace helpers | `src/utils/settingUtils.ts`, `src/utils/workspaceUtils.ts`, `src/node/fs-extra.ts`, `src/browser/fs-extra.ts` | Resource-scoped configuration, multi-root selection, and separate filesystem adapters; do not assume all Node operations work in a browser host. |
| Public API | `src/commands/api/vscode-azurecontainerapps.api.d.ts`, `src/commands/api/CHANGELOG.md` | Versioned `deployImage` and `deployWorkspaceProject` contracts, plus compatibility command registration. Test-only exports live in `src/testApi.ts`. |
| Tests and engineering | `test/`, `package.json`, `esbuild.mjs`, `.vscode-test.mjs`, `.github/workflows/main.yml`, `.config/` | VS Code-hosted tests, gated live-Azure scenarios, and shared Azure Tools build/pipeline configuration. |

## External ownership

- `@microsoft/vscode-azext-utils` owns action/error handling, wizards, activities,
  tree state, and test UI helpers.
- `@microsoft/vscode-azext-azureutils` owns common Azure resource UI, subscription
  client construction, provider verification, and related authentication helpers.
- `@microsoft/vscode-azext-github` supplies shared GitHub integration helpers;
  repository connection orchestration lives in `src/commands/gitHub/`.
- The Azure Resources extension hosts the resource explorer and subscription
  picker. Its API handshake is required before using `ext.rgApiV2`.
- Azure SDK packages own service models and operations, not the extension's
  draft, confirmation, workspace-settings, or tree-refresh contracts.
- `@microsoft/vscode-azext-eng` and `microsoft/vscode-azuretools` own shared
  engineering configuration and CI templates. Review ownership is recorded in
  [.github/CODEOWNERS](.github/CODEOWNERS).
