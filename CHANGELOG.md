# Change Log

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
