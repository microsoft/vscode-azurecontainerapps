---
description: >-
  Use when working on Express or Standard compatibility, app creation or
  deployment, registry credentials and secrets, managed identities,
  revision drafts or modes, ingress defaults, or optional Log Analytics.
---

# Express and Standard compatibility

Preserve these constraints when changing Container Apps creation, deployment, registry access, revision drafts, or diagnostics. They describe Express's default service behavior and the shared implementation choices needed to support it. Do not apply Express identity restrictions to Standard apps, or restrict shared correctness fixes to Express.

## Detect the environment mode

Use the managed environment's `environmentMode === 'Express'` to identify Express. The creation wizard maps `EnvironmentAppType.Express` to `Express` and `EnvironmentAppType.Standard` to `WorkloadProfiles`. Do not infer the mode from an app's name, identity configuration, logging configuration, or the portal that created it.

Load the environment when a command starts with only an app and needs mode-dependent behavior. A missing environment on the wizard context does not establish that the app is Standard. Tree items propagate the environment's Express flag to app items.

See [ManagedEnvironmentCreateStep](../../src/commands/createManagedEnvironment/ManagedEnvironmentCreateStep.ts), [ManagedEnvironmentItem](../../src/tree/ManagedEnvironmentItem.ts), and [assessRegistryPullAccess](../../src/commands/registryCredentials/identity/assessRegistryPullAccess.ts).

## Express supports single-revision deployment only

The [Express feature matrix](https://learn.microsoft.com/en-us/azure/container-apps/express-overview#supported-features) documents single-revision deployment as built in and lists multiple revisions, traffic splitting, and deployment labels as unsupported. Updates replace the active revision automatically. Treat single-revision mode as an Express service constraint, not just a creation default. Standard supports both Single and Multiple modes.

Express does not support revision restart. Hide Restart in Express menus, filter Express environments and apps out of the Restart picker, and reject direct invocation. Keep Standard restart behavior in both revision modes. The [service error captured in issue #1175](https://github.com/microsoft/vscode-azurecontainerapps/issues/1175) reports this restriction explicitly; the feature matrix alone does not establish revision restart support.

Do not equate single-revision mode with an absence of revision history. In the [general Container Apps revision model](https://learn.microsoft.com/en-us/azure/container-apps/revisions), Single controls which revision is active, while inactive revisions can remain. The Express feature matrix does not establish its historical revision retention policy or say that registry cleanup exists because old revisions are not retained.

Registry credentials and secrets are application-scoped configuration, not snapshots owned by individual revisions. Standard revisions can depend on that shared configuration, so do not prune it based only on the latest template. Express's single-revision restriction also does not change `configuration.registries` or `configuration.secrets` from arrays into singular fields, or justify clearing unrelated entries in extension code.

The extension currently creates both app types with `activeRevisionsMode: Single`. That alone is not enforcement of the Express restriction. The shared revision-mode picker still offers both modes without an Express-specific check. Do not treat that picker as evidence that Multiple works on Express, or describe it as already gated.

See [ContainerAppCreateStep](../../src/commands/createContainerApp/ContainerAppCreateStep.ts), [ChooseRevisionModeStep](../../src/commands/revision/chooseRevisionMode/ChooseRevisionModeStep.ts), and the [application-scoped secrets model](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets).

## Portal GitHub connection

The Portal-backed **Connect to a GitHub Repository** action uses SourceControl
resources, which the service rejects on Express. The service error captured in
[issue #1188](https://github.com/microsoft/vscode-azurecontainerapps/issues/1188)
establishes this restriction. Hide the Actions node for Express, exclude Express
environments and apps from the connection picker, and reject direct invocation.
When an invocation supplies only an app and subscription, load its environment
before deciding eligibility. Preserve the Standard connection flow.

This restriction applies to the Portal's SourceControl integration, not to
GitHub Actions workflows that deploy container images independently.

## ACR pull identities

Express requires a user-assigned managed identity attached directly to the container app for managed-identity image pulls. Attaching it only to the environment is no longer sufficient. Do not offer the app's system-assigned identity or environment identities as eligible Express pull identities.

Standard retains its broader identity support. It can reuse app or environment user-assigned identities, the app's system-assigned identity through `system`, and the environment's system-assigned identity through `system-environment`. Do not force Standard users to create a new identity if an old legacy path still works.

Keep the following operations distinct:

- Grant or verify `AcrPull` for the identity's principal on the registry or an inherited scope.
- Set the registry credential's `identity` reference.
- Attach an explicitly selected or created user-assigned identity to the app using its resource ID.

A saved registry identity reference alone does not prove access. Use `assessRegistryPullAccess` before prompting for new credentials. Preserve an eligible configured identity with `AcrPull`, then prefer another eligible app identity before falling back to Standard environment identities. An eligible identity with access may need only a registry credential reference, not a new role assignment or attachment.

The assessment checks direct `AcrPull` role assignments at the registry or inherited scopes. It is not a complete authorization evaluator for group membership, custom roles, or repository permissions. Skip deleted user-assigned identities, but do not turn other lookup failures into "no access".

Use `getContainerAppIdentity` for explicit attachments. Preserve existing user-assigned and system-assigned identities, compare resource IDs case-insensitively, and serialize attachment values as `{}`. ARM-returned `clientId` and `principalId` are not writable attachment fields. Do not derive app attachments from every registry identity reference.

See [assessRegistryPullAccess](../../src/commands/registryCredentials/identity/assessRegistryPullAccess.ts), [AcrPullManagedIdentityListStep](../../src/commands/registryCredentials/identity/AcrPullManagedIdentityListStep.ts), [getContainerAppIdentity](../../src/commands/registryCredentials/identity/getContainerAppIdentity.ts), and [updateContainerApp](../../src/commands/updateContainerApp.ts).

## Deploy images and their credentials together

By default, Express cleans up unused registry credentials and secrets rather than retaining an accumulating credential history. Treat the returned configuration as current state, and do not rely on unused credentials remaining available for a later deployment. This is Express-specific behavior, not a consequence of selecting Single mode on Standard. The cleanup policy does not establish whether Express retains historical revisions.

In Standard, old unused registry credentials are expected to persist in the `configuration.registries` array until explicitly removed, so `View Properties` continues to show them after switching images or registries. Do not carry that expectation over to Express. Express automatically trims unused entries, so after refreshing the app, `View Properties` can show an array without those old credentials. `View Properties` displays the app model; it does not cause the removal. A missing unused entry on Express is therefore not necessarily a failed save or an extension merge bug. Do not try to restore unused credentials with repeated credentials-only updates.

Saving credentials before deploying the image that consumes them is therefore not a safe staging mechanism for Express. Separate updates can also validate the old image with the new credentials and fail before the replacement image is submitted.

For both Express and Standard, stage draft registry changes locally and submit the new template, registry credentials, secrets, and required app identity attachments together in one app update. This shared behavior covers both Docker Login and managed-identity authentication. Do not reintroduce a live credentials-only update into either `editContainer` or `editContainerImage`.

- `RegistryCredentialsAndSecretsConfigurationStep` also handles automatic caching for draft commands rather than updating the live app.
- `RevisionDraftFile.registryConfiguration` holds the staged configuration in memory, outside the editable template JSON. Do not write credential secrets into draft contents, logs, or telemetry. The cache does not survive an extension-host restart.
- `DeployRevisionDraftStep` merges the staged changes with the current app configuration and fetched secrets before submitting the template and identity attachments in the same request.
- Keep staged configuration after a failed deployment so the draft can be retried. Discard it with the draft after successful deployment or an explicit discard.

Preserve the extension's additive merge behavior for both Express and Standard. Add new registry credentials and secrets to the existing arrays rather than replacing the arrays with only the latest entries. Express's automatic service-side trimming is context for interpreting returned registries and secrets, not an instruction to prune them in extension code or change how updates are built.

Use `mergeRegistryConfiguration` for direct deployment, repeated draft edits, and draft deployment. Updates replace matching registry entries by case-insensitive server name and matching secrets by case-sensitive name. Preserve unrelated entries and avoid duplicate same-name secrets or mutations of the inputs. When inspecting Express through `View Properties` or validating a deployment response, do not assume every unused entry sent in the merged configuration will still be present.

`RegistryConfiguration.managedIdentityIds` records explicit app attachments, not all identities referenced by registries. Keep only IDs still referenced after merging. If a draft switches a registry to password authentication or another identity, do not attach the superseded staged identity. This pruning must not remove identities already attached to the live app.

Read secrets through `getContainerEnvelopeWithSecrets` when merging a full configuration. Ordinary app reads do not return their values. Do not overwrite existing secrets with an incomplete GET response.

See [RegistryCredentialsAndSecretsConfigurationStep](../../src/commands/registryCredentials/RegistryCredentialsAndSecretsConfigurationStep.ts), [mergeRegistryConfiguration](../../src/commands/registryCredentials/mergeRegistryConfiguration.ts), [RevisionDraftFileSystem](../../src/commands/revisionDraft/RevisionDraftFileSystem.ts), and [DeployRevisionDraftStep](../../src/commands/revisionDraft/deployRevisionDraft/DeployRevisionDraftStep.ts).

## Draft changes are more than template JSON

Staged registry configuration is an unsaved change even when the template bytes are unchanged. Preserve dirty-state checks on both app and revision draft items, and notify the tree when a credential-only draft update occurs.

Use `areTemplateValuesEqual` for template and nested template dirty checks in both app types. SDK objects can contain explicit `undefined` properties that draft JSON omits. Raw deep equality produces false change markers for otherwise identical containers, environment variables, scale settings, and scale rules. Preserve detection of real nested changes and array ordering.

See [ContainerAppItem](../../src/tree/ContainerAppItem.ts), [RevisionDraftItem](../../src/tree/revisionManagement/RevisionDraftItem.ts), and [areTemplateValuesEqual](../../src/utils/areTemplateValuesEqual.ts).

## Log Analytics is optional

Express apps created in the Azure Container Apps portal no longer attach a Log Analytics workspace by default, to reduce base cost. Missing `appLogsConfiguration`, `logAnalyticsConfiguration`, or `customerId` is valid and must not block creation, deployment, or startup verification.

The extension's shared environment creation flows also no longer create or attach a workspace by default, including for Standard. Do not restore automatic workspace creation, workspace-name prompts, workspace provider registration, or logging-based location filtering as an incidental dependency of app deployment.

Keep support for existing environments that have Log Analytics configured. Startup verification may query logs when a workspace customer ID exists, but must skip that optional enrichment when it does not. Do not create a workspace just to obtain diagnostics or assume deployment results include a workspace ID.

See [ManagedEnvironmentCreateStep](../../src/commands/createManagedEnvironment/ManagedEnvironmentCreateStep.ts), [getVerifyProvidersStep](../../src/utils/getVerifyProvidersStep.ts), [getDeployWorkspaceProjectResults](../../src/commands/deployWorkspaceProject/getDeployWorkspaceProjectResults.ts), and [ContainerAppStartVerificationStep](../../src/commands/image/imageSource/ContainerAppStartVerificationStep.ts).

## Preserve mode-specific creation defaults

Use `getContainerAppDefaults` rather than duplicating creation defaults in another entry point. Express creation uses HTTP transport and an HTTP scaling rule, while Standard uses the shared enabled-ingress defaults. Do not copy Standard's automatic transport and traffic configuration into Express creation without checking service compatibility.

Creation defaults are not instructions to reset existing apps. Preserve configured ingress and other user settings when updating an app.

See [containerAppDefaults](../../src/commands/createContainerApp/containerAppDefaults.ts), [ContainerAppCreateStep](../../src/commands/createContainerApp/ContainerAppCreateStep.ts), and [ingressDefaults](../../src/commands/ingress/ingressDefaults.ts).
