# Change Log

## 1.0.0
### Changed
* [[Todo: Add reference to this PR]()] Add a new resource location parameter to the `deployWorkspaceProjectApi` definition.  If no location is provided, try to infer location via other provided resources.
* [[Todo: Add upcoming dwp pr]()] [[Todo: Add reference to this pr]()] Suppress registry prompting by default and remove flag (`suppressRegistryPrompt`)

## 0.0.3
### Added
* [[817]](https://github.com/microsoft/vscode-azurecontainerapps/pull/817) Added an API entry-point and compat wrapper for existing `deployImageApi` command

### Changed
* [[816]](https://github.com/microsoft/vscode-azurecontainerapps/pull/816) Added backward compatibility to ensure existing functionality remains unaffected by new managed identity features.

## 0.0.2
### Changed
* [[615]](https://github.com/microsoft/vscode-azurecontainerapps/pull/615) Removed ability to set option `ignoreExistingDeploySettings`. This will now happen automatically by default.

## 0.0.1
### Added
* [[578]](https://github.com/microsoft/vscode-azurecontainerapps/pull/578) Added an API entry-point to the `deployWorkspaceProject` command
