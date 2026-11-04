---
applyTo: "src/extension.ts,src/extensionVariables.ts,src/tree/**/*.ts,src/commands/registerCommands.ts,src/commands/api/**/*.ts,src/commands/revealInEnvironment.ts,src/utils/azureClients.ts,src/utils/pickItem/**/*.ts,src/utils/getResourceUtils.ts,package.json,package.nls.json"
---

# Resource tree, authentication, and API contracts

- `src/extension.ts` registers two branch providers through the Azure Resources
  API handshake. `createContainerAppsApiProvider.ts` requests a compatible host
  API asynchronously; preserve error reporting and readiness before host access.
  Do not replace the host's account/resource explorer with a local implementation.
- `ContainerAppsBranchDataProvider` serves the environment hierarchy.
  `ContainerAppsResourceBranchDataProvider` serves standalone flat app nodes.
  Preserve their distinct context values and IDs: the `#flat` suffix is UI
  identity only; use `containerAppId` for the underlying ARM ID.
- Use `ContainerAppItem.CreateContainerAppModel`/`Get` for normalized app models.
  Preserve managed-environment association, resource group, and revision mode.
  Single mode exposes template children directly; multiple mode exposes a
  revisions group. Do not accidentally collapse these into one tree shape.
- Preserve operation-state wrapping through `ext.state`, stable child IDs,
  `notifyChildrenChanged`, and the appropriate branch refresh. Mutations may
  need to refresh the environment parent rather than a flat app leaf.
- `src/utils/pickItem/` contains resource-specific picker/filter behavior. Keep
  parent selection, auto-selection of drafts, and subscription identity aligned;
  do not assume a rich `ContainerAppItem` was passed for every contributed action.
- Create Azure clients through `src/utils/azureClients.ts`. Keep lazy SDK imports,
  shared client context, custom-cloud authorization handling, and deliberate
  preview API-version overrides. A management-plane endpoint, registry login
  server, portal URL, and Log Analytics audience are not interchangeable.
- `src/commands/api/vscode-azurecontainerapps.api.d.ts` is an external contract.
  Preserve option defaults, absolute filesystem path semantics, suppression
  flags, return fields, and error propagation. Keep implementation, provider API
  version, compatibility command, and API changelog aligned for API changes.
- Production API exports and the `VSCODE_RUNNING_TESTS` test API differ. Do not
  expose internal test entry points or bypass the host handshake in production.
  `DeployWorkspaceProjectResults` may contain a registry password: return only
  what the existing contract requires and never log the full object.
