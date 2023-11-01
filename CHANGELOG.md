# Change Log

## 0.6.0 - 2023-10-31'

### Added
* Large rework of the container apps UI
    * `Configurations` item present in all revision modes - houses the old `Dapr` and `Ingress` items as well as the new GitHub `Actions` and `Secrets` items [#379](https://github.com/microsoft/vscode-azurecontainerapps/pull/379)
    * `Revision Management` item in multiple revisions mode where revisions now live [#379](https://github.com/microsoft/vscode-azurecontainerapps/pull/379), [#390](https://github.com/microsoft/vscode-azurecontainerapps/pull/390)
    * Revision `Draft` item support when in multiple revisions mode [#413](https://github.com/microsoft/vscode-azurecontainerapps/pull/413), [#453](https://github.com/microsoft/vscode-azurecontainerapps/pull/453)
    * Reconfigured the context menu for many items, especially the container app item [#518](https://github.com/microsoft/vscode-azurecontainerapps/pull/518)

* New family of commands: `Deploy Project from Workspace`, `Create Container App from Workspace`, `Deploy Workspace to Container App` [#425](https://github.com/microsoft/vscode-azurecontainerapps/issues/425)
    * Todo: Link to README?
    * Creating Azure Container Registries [#435](https://github.com/microsoft/vscode-azurecontainerapps/pull/435)
    * Dockerfile port smart detection for ingress configuration [#449](https://github.com/microsoft/vscode-azurecontainerapps/pull/449)
    * Improve environment variable file smart detection logic [#450](https://github.com/microsoft/vscode-azurecontainerapps/pull/450)
    * Save and re-deploy to Azure resources through workspace settings [#454](https://github.com/microsoft/vscode-azurecontainerapps/pull/454)
    * Leverage a new form of activity log support for displaying multiple activities in a single command [#464](https://github.com/microsoft/vscode-azurecontainerapps/pull/464)
    * Expand command entry-points to include container apps environment and container app items [#482](https://github.com/microsoft/vscode-azurecontainerapps/pull/482)

* New revision draft editing mode for bundling deployment changes [#311](https://github.com/microsoft/vscode-azurecontainerapps/issues/311)
    * Todo: Link to README?
    * `Edit Container App (Advanced)` and `Discard Draft` in single revision mode [#405](https://github.com/microsoft/vscode-azurecontainerapps/pull/405)
    * `Create Draft` and `Edit Draft (Advanced)` in multiple revision mode [#413](https://github.com/microsoft/vscode-azurecontainerapps/pull/413)
    * `Deploy Draft` support (all modes) [#414](https://github.com/microsoft/vscode-azurecontainerapps/pull/414)
    * Ability for container app template commands to hook into the new revision draft update system [#423](https://github.com/microsoft/vscode-azurecontainerapps/pull/423)
    * Display a user setting controlled deployment pop-up when executing revision draft commands [#478](https://github.com/microsoft/vscode-azurecontainerapps/pull/478)

* Log streaming support [#350](https://github.com/microsoft/vscode-azurecontainerapps/pull/350)
* Deploying to a container app via a connected GitHub repository [#353](https://github.com/microsoft/vscode-azurecontainerapps/issues/313)
* Tree view and CRUD support for container app secrets
* Delete existing scale rules [#461](https://github.com/microsoft/vscode-azurecontainerapps/pull/461)
* Activity log support to the majority of commands

### Changed
* Use smart detection to suggest values when deploying from a container registry [#305](https://github.com/microsoft/vscode-azurecontainerapps/pull/305), [#331](https://github.com/microsoft/vscode-azurecontainerapps/pull/331)
* Revision draft commands:
    * Reconfigure existing `Scaling` commands and items to utilize the new revision draft design [#420](https://github.com/microsoft/vscode-azurecontainerapps/issues/420)
        * `Edit Scaling Range` [#466](https://github.com/microsoft/vscode-azurecontainerapps/pull/466)
        * `Add Scale Rule` [#423](https://github.com/microsoft/vscode-azurecontainerapps/pull/423)
        * `Delete Scale Rule` [#461](https://github.com/microsoft/vscode-azurecontainerapps/pull/461)
    * `Update Container Image` was added as the draft alternative to `Deploy to Container App` [#477](https://github.com/microsoft/vscode-azurecontainerapps/pull/477)

### Fixed
* Remove `Activate`, `Deactivate`, and `Restart` revision commands when not applicable [#356](https://github.com/microsoft/vscode-azurecontainerapps/pull/356)
* Fix command palette support for `Restart` [#487](https://github.com/microsoft/vscode-azurecontainerapps/pull/487)

### Removed
* `Deploy to Container App...` was removed in favor of `Deploy Workspace to Container App` or `Update Container Image`
    * `Deploy Workspace to Container App` can be used if one wishes to immediately deploy a VS Code workspace project OR
    * `Update Container Image` can be used to update the container app's image in draft mode and then later deployed

### Engineering
* Decoupled `Ingress` commands from the `createContainerApp` workflow [#371](https://github.com/microsoft/vscode-azurecontainerapps/pull/371), [375](https://github.com/microsoft/vscode-azurecontainerapps/pull/375)
* Improved telemetry types and handling across all major commands [#514](https://github.com/microsoft/vscode-azurecontainerapps/pull/514), [#517](https://github.com/microsoft/vscode-azurecontainerapps/pull/517), [#524](https://github.com/microsoft/vscode-azurecontainerapps/pull/524)

## 0.5.1 - 2023-05-17

### Added
* Add support for the upcoming Azure Resources Focus feature

## 0.5.0 - 2023-04-14

### Added

* Enable extension to run on a web environment (`.dev`) by @nturinski in [#288](https://github.com/microsoft/vscode-azurecontainerapps/pull/288), [#327](https://github.com/microsoft/vscode-azurecontainerapps/pull/327), [#328](https://github.com/microsoft/vscode-azurecontainerapps/pull/328)
    * Expansive list of changes that were required are documented under [#239](https://github.com/microsoft/vscode-azurecontainerapps/issues/239)
* Add a more generic deploy command by @motm32 in [#277](https://github.com/microsoft/vscode-azurecontainerapps/pull/277)
* Implement the `Use quickstart image` method when creating a Container App by @motm32 in [#274](https://github.com/microsoft/vscode-azurecontainerapps/pull/274)
* Implement `Build from project remotely using Azure` command by @motm32 in [#292](https://github.com/microsoft/vscode-azurecontainerapps/pull/292)
* Expand image source selection interface for creating Container Apps by @MicroFish91 in [#273](https://github.com/microsoft/vscode-azurecontainerapps/pull/273)

### Changed

* Update SUPPORT.md by @alexweininger in [#263](https://github.com/microsoft/vscode-azurecontainerapps/pull/263)

### Fixed

* Removed `Open Logs in Portal` from the command palette [#194](https://github.com/microsoft/vscode-azurecontainerapps/issues/194)
* An error occurs after selecting "Sign in to Azure" by @alexweininger [#278](https://github.com/microsoft/vscode-azurecontainerapps/issues/278)
* Default to single revision mode when creating a Container App by @MicroFish91 in [#300](https://github.com/microsoft/vscode-azurecontainerapps/pull/300)

### Engineering

* Reconfigure base create/deployment patterns and add new image sourcing patterns to enable `Code to Cloud` integrations by @MicroFish91 [#276](https://github.com/microsoft/vscode-azurecontainerapps/issues/276)

## 0.4.1 - 2023-02-22

### Fixed

* Add container app update call back to `deployImage` by @MicroFish91 in [#266](https://github.com/microsoft/vscode-azurecontainerapps/pull/266)
* Remove legacy reference to `rgApi` by @MicroFish91 in [#264](https://github.com/microsoft/vscode-azurecontainerapps/pull/264)

## 0.4.0 - 2023-02-22

### Added
* Command for deploying to ACA from Docker extension by @bwateratmsft in [#212](https://github.com/microsoft/vscode-azurecontainerapps/pull/212)

### Changed
* Add information to the Activity Log that deleting a Container App Environment might take a while by @motm32 in [#238](https://github.com/microsoft/vscode-azurecontainerapps/pull/238)

### Fixed
* Fix name validation when creating a container app by @motm32 in [#222](https://github.com/microsoft/vscode-azurecontainerapps/pull/222)
* Remove `View Output` popup after creation of Container Apps Environment by @MicroFish91 in [#245](https://github.com/microsoft/vscode-azurecontainerapps/pull/245)
* Be consistent with `Container Apps: Delete Confirmation` setting by @motm32 in [#233](https://github.com/microsoft/vscode-azurecontainerapps/pull/233)

### Engineering
* Rewrite extension for v2 API by @alexweininger in [#235](https://github.com/microsoft/vscode-azurecontainerapps/pull/235)
* Removed use of deprecated `Azure Log Analytics` package by @MicroFish91 in [#207](https://github.com/microsoft/vscode-azurecontainerapps/pull/207)

### Dependencies
* Bump version after release by @github-actions in [#206](https://github.com/microsoft/vscode-azurecontainerapps/pull/206)
* Bump @xmldom/xmldom from 0.7.5 to 0.7.8 by @dependabot in [#220](https://github.com/microsoft/vscode-azurecontainerapps/pull/220)
* Bump loader-utils from 1.4.0 to 1.4.1 by @dependabot in [#221](https://github.com/microsoft/vscode-azurecontainerapps/pull/221)
* Bump loader-utils from 1.4.1 to 1.4.2 by @dependabot in [#223](https://github.com/microsoft/vscode-azurecontainerapps/pull/223)
* Bump minimatch and mocha by @dependabot in [#224](https://github.com/microsoft/vscode-azurecontainerapps/pull/224)
* Bump decode-uri-component from 0.2.0 to 0.2.2 by @dependabot in [#228](https://github.com/microsoft/vscode-azurecontainerapps/pull/228)
* Bump json5 from 1.0.1 to 1.0.2 by @dependabot in [#231](https://github.com/microsoft/vscode-azurecontainerapps/pull/231)

## 0.3.0 - 2022-09-15

### Added
- HTTP and Azure queue scale rule support

### Changed
- Now depends on the "Azure Resources" extension which provides a unified "Resource Groups" view
- Wired up basic add/delete functionality (Container App & Container Environments) through the activity log

### Fixed
- [Bugs Fixed](https://github.com/microsoft/vscode-azurecontainerapps/milestone/5?closed=1)

## 0.2.0 - 2022-07-07

### Changed
- Update @azure/arm-appcontainers SDK to stable api-version
- Update @vscode/extension-telemetry to 0.6.2
- Minimum version of VS Code updated to 1.66.0

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurecontainerapps/milestone/4?closed=1)

## 0.1.1 - 2022-05-20

### Added
- Deploy container images from any public registry
- Edit scale rules of a revision
- Open "Log Streaming" and "Console" via [Azure Portal](https://ms.portal.azure.com/)

### Changed
- Warning when deploying to container app that has features unsupported by VS Code
    - Examples include: `volumes`, `volumeMounts`, `probes`

### Fixed
- [Bugs fixed](https://github.com/microsoft/vscode-azurecontainerapps/milestone/2?closed=1)

## 0.1.0 - 2022-04-12

### Added
- Create new Container Apps environments
- Create new Container Apps
- Deploy and update containers
- View and manage ingress endpoints
- Start, stop, and restart container revisions
