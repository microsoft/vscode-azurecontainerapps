---
applyTo: "src/commands/createContainerApp/**/*.ts,src/commands/createManagedEnvironment/**/*.ts,src/commands/deleteContainerApp/**/*.ts,src/commands/deleteManagedEnvironment/**/*.ts,src/commands/deployContainerApp/**/*.ts,src/commands/deployImage/**/*.ts,src/commands/deployWorkspaceProject/**/*.ts,src/commands/image/**/*.ts,src/commands/registryCredentials/**/*.ts,src/commands/gitHub/**/*.ts,src/utils/settingUtils.ts,src/utils/workspaceUtils.ts"
---

# Resource wizards and image deployment

- Compose `AzureWizard` steps using the existing typed contexts and shared
  resource/provider/location steps. Preserve prompt/execute separation,
  `shouldPrompt`/`shouldExecute`, back navigation, and activity output.
- List steps offer existing resources and a create pick with `data: undefined`.
  Their `getSubWizard` injects creation steps when the selected resource is
  absent. Do not add sentinel strings, separate create-state flags, or duplicate
  list/create steps in a parent wizard.
- `ManagedEnvironmentListStep` populates related resource group, Log Analytics
  workspace, and location for existing environments. Preserve new versus reused
  environment paths. For logging defaults and optional workspace attachment,
  follow [Express compatibility instructions](express-compatibility.instructions.md).
- Consult `src/commands/EXECUTE_PRIORITY.md` and the actual step priorities:
  provider/resource group -> environment -> registry -> credentials -> build/image
  -> app -> later configuration/draft deployment. Changing array order alone
  does not change numeric execute priority. Preserve deletion confirmations and
  resource ownership; do not delete reused shared resources as implicit cleanup.
- `deployContainerApp` rejects multiple-revision/multiple-container shortcuts;
  remote ACR builds redirect to workspace deployment. Editing a specific
  container is a separate path. Preserve these guards and container index zero
  as well as later indices; an index is not a truthy/falsey selection flag.
- Workspace deployment has tree-based and saved-configuration entry points.
  Preserve V1-to-V2 conversion, configuration selection/index, deployment mode,
  source/Dockerfile/env path validation, and opt-in saving. Use
  `dwpSettingUtilsV2` and `settingUtils` with the actual root folder; do not
  overwrite another monorepo app's settings or save credentials there.
- Remote builds use ACR source upload and scheduled Docker builds, not a local
  Docker daemon as a universal prerequisite. Preserve source-root-relative
  Dockerfile paths, archive/upload handling, failure logs, and temporary archive
  cleanup in `RunStep`. Do not include source contents or SAS URLs in telemetry.
- Registry access has distinct Docker-login and managed-identity branches.
  Follow [Express compatibility instructions](express-compatibility.instructions.md)
  for mode-specific identity eligibility, access assessment, attachments, and
  atomic image/credential updates. Admin-user enablement has a confirmation.
- Build success, ARM update completion, and healthy startup are separate.
  `ContainerAppStartVerificationStep` checks the deployed revision/image and
  accepts running or scaled-to-zero status; preserve bounded polling, failure
  reporting, and best-effort log-query diagnostics without turning failed
  startup into success. Its Log Analytics helper is public-cloud-specific.
- GitHub connection currently opens the deployment portal because the extension
  lacks scopes to fully manage service principals/federated credentials.
  Preserve that boundary, existing repository/action setup, credential handling,
  and explicit disconnect confirmation; do not conflate an image deployment
  with configuring continuous deployment.
