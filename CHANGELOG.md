# Change Log

## 0.3.0 - 2022-09-15

### Added
- HTTP and Azure queue scale rule support

### Changed
- Now depends on the "Azure Resources" extension which provides a unified "Resource Groups" view
- Wired up basic add/delete functionality (Container App & Container Environments) through the activity log

### Fixed
- [Use revision specific data to create scale rule](https://github.com/microsoft/vscode-azurecontainerapps/pull/165)
- [Fix Container App Name Steps](https://github.com/microsoft/vscode-azurecontainerapps/issues/65)
- [Change Log Analytics Location to Match Managed Environment Location](https://github.com/microsoft/vscode-azurecontainerapps/issues/130)
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
