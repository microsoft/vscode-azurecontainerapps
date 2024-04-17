# Change Log

## 0.7.0 - 2024-04-17

This update comes with some major changes to the `Deploy Project from Workspace...` family of commands. We have now expanded support for monorepos by enabling the deployment and saving of multiple app configurations within the same workspace project.  New settings configurations can now be found under `containerApps.deploymentConfigurations`.  Any older settings will be migrated automatically to the new schema.

We have also included a new getting started walkthrough which steps through first time deployment using the Azure Container Apps extension.

For more information please consult our [README](https://github.com/microsoft/vscode-azurecontainerapps#readme).

### Added
* [[59]](https://github.com/microsoft/vscode-azurecontainerapps/issues/39) Add a getting started walkthrough
* [[607]](https://github.com/microsoft/vscode-azurecontainerapps/issues/607) Expand support for monorepos and deploying multiple app configurations within the same workspace project

### Changed
* [[335]](https://github.com/microsoft/vscode-azurecontainerapps/issues/335) Give more context when displaying image source selection options while creating a container app
* [[634]](https://github.com/microsoft/vscode-azurecontainerapps/pull/634) Remove auto-naming of resources based on the workspace name and always prompts for new app names
* [[669]](https://github.com/microsoft/vscode-azurecontainerapps/pull/669) Recommend previously deployed to managed environments
* [[668]](https://github.com/microsoft/vscode-azurecontainerapps/pull/668) Prompt for a separate name when choosing to create a new managed environment
* [[641]](https://github.com/microsoft/vscode-azurecontainerapps/pull/641) Add support for taking a saved `envPath` and converting it to environment variables

### Fixed
* [[627]](https://github.com/microsoft/vscode-azurecontainerapps/pull/627) Use existing env variables when updating container app if "skipped"

## 0.6.2 - 2024-02-20

This patch includes improvements to image building stability.  We have made improvements to the way we bundle/upload project files and also automatically detect and filter unsupported ACR Dockerfile `--platform` flags.  For any ACR build error logs that are returned, we now provide a dedicated location for them to reside in the activity log, where they are more easily accessed.

### Added
* [[586]](https://github.com/microsoft/vscode-azurecontainerapps/pull/586) Add support for choosing a source directory when deploying a workspace project
* [[601]](https://github.com/microsoft/vscode-azurecontainerapps/pull/601) Image building through ACR does not currently accept `--platform` flag syntax.  Improve deploy experience by detecting and removing `--platform` flags from the Dockerfile automatically
* [[580]](https://github.com/microsoft/vscode-azurecontainerapps/issues/580) Support workload profiles environments
* [[576]](https://github.com/microsoft/vscode-azurecontainerapps/pull/576) Add an entry-point to view ACR build image error logs in the activity log
* [[577]](https://github.com/microsoft/vscode-azurecontainerapps/pull/577) Add retries for `Build Image in Azure`
* [[569]](https://github.com/microsoft/vscode-azurecontainerapps/issues/569) Add JSON validation support for editing container app envelopes
* [[573]](https://github.com/microsoft/vscode-azurecontainerapps/pull/573) Ask to enable admin user when deploying an image through the Docker extension entry-point

### Fixed
* [[594]](https://github.com/microsoft/vscode-azurecontainerapps/pull/594) Update the TAR build logic
* [[602]](https://github.com/microsoft/vscode-azurecontainerapps/pull/602) Deploying from a folder with an invalid name fails
* [[574]](https://github.com/microsoft/vscode-azurecontainerapps/pull/574) An extra input box pops up when executing `Disconnect from Repo` command

### Engineering
* [[578]](https://github.com/microsoft/vscode-azurecontainerapps/pull/578) Create an API for the `deployWorkspaceProject` command

## 0.6.1 - 2023-11-07

### Added
* Added the `Microsoft.ContainerRegistry` provider to the verify providers list.  This will make it so that users do not have to go into the portal to register their subscription when accessing registries for the first time [#558](https://github.com/microsoft/vscode-azurecontainerapps/pull/558)

### Changed
* Improve image name validation and make suggested image names unique by appending a timestamped tag [#560](https://github.com/microsoft/vscode-azurecontainerapps/pull/560) [#565](https://github.com/microsoft/vscode-azurecontainerapps/pull/565)

### Fixed
* Addressed an issue where VS Code was passing incompatible tree items to the container apps local workspace ribbon commands. If an incompatible tree item is passed, we will now treat it as if no tree item was passed [#559](https://github.com/microsoft/vscode-azurecontainerapps/pull/559)

## 0.6.0 - 2023-11-01

### Added
* New family of commands: `Deploy Project from Workspace`, `Create Container App from Workspace`, `Deploy Workspace to Container App` [#425](https://github.com/microsoft/vscode-azurecontainerapps/issues/425)

    _For more information please see our [README](https://github.com/microsoft/vscode-azurecontainerapps#readme)_
    * Creating Azure Container Registries [#435](https://github.com/microsoft/vscode-azurecontainerapps/pull/435)
    * Dockerfile port smart detection for ingress configuration [#449](https://github.com/microsoft/vscode-azurecontainerapps/pull/449)
    * Improve environment variable file smart detection logic [#450](https://github.com/microsoft/vscode-azurecontainerapps/pull/450)
    * Save and re-deploy to Azure resources through workspace settings [#454](https://github.com/microsoft/vscode-azurecontainerapps/pull/454)
    * Leverage a new form of activity log support for displaying multiple activities in a single command [#464](https://github.com/microsoft/vscode-azurecontainerapps/pull/464)
    * Expand command entry-points to include container apps environment and container app items [#482](https://github.com/microsoft/vscode-azurecontainerapps/pull/482)

* New revision draft editing mode for bundling deployment changes [#311](https://github.com/microsoft/vscode-azurecontainerapps/issues/311)
    * `Edit Container App (Advanced)` and `Discard Draft` in single revision mode [#405](https://github.com/microsoft/vscode-azurecontainerapps/pull/405)
    * `Deploy Draft` support (all modes) [#414](https://github.com/microsoft/vscode-azurecontainerapps/pull/414)
    * Ability for container app template commands to hook into the new revision draft update system [#423](https://github.com/microsoft/vscode-azurecontainerapps/pull/423)
    * Display a user setting controlled deployment pop-up when executing revision draft commands [#478](https://github.com/microsoft/vscode-azurecontainerapps/pull/478)

* Log streaming support [#350](https://github.com/microsoft/vscode-azurecontainerapps/pull/350)
* Deploying to a container app via a connected GitHub repository [#353](https://github.com/microsoft/vscode-azurecontainerapps/issues/313)
* Tree view and CRUD support for container app secrets
* Delete existing scale rules [#461](https://github.com/microsoft/vscode-azurecontainerapps/pull/461)
* Improve activity log support for the majority of commands

### Changed
* Large rework of the container apps UI
    * `Configurations` item present in all revision modes - houses the old `Dapr` and `Ingress` items as well as the new GitHub `Actions` and `Secrets` items [#379](https://github.com/microsoft/vscode-azurecontainerapps/pull/379)
    * `Revision Management` item in multiple revisions mode where revisions now live [#379](https://github.com/microsoft/vscode-azurecontainerapps/pull/379), [#390](https://github.com/microsoft/vscode-azurecontainerapps/pull/390)
    * Revision `Draft` item support when in multiple revisions mode [#413](https://github.com/microsoft/vscode-azurecontainerapps/pull/413), [#453](https://github.com/microsoft/vscode-azurecontainerapps/pull/453)
    * Reconfigured the context menu for many items, especially the container app item [#518](https://github.com/microsoft/vscode-azurecontainerapps/pull/518)

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

### Engineering
* Decoupled `Ingress` commands from the `createContainerApp` workflow [#371](https://github.com/microsoft/vscode-azurecontainerapps/pull/371), [375](https://github.com/microsoft/vscode-azurecontainerapps/pull/375)

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
