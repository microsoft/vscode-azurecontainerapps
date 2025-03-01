/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * This is the external face of extension.bundle.js, the main webpack bundle for the extension.
 * Anything needing to be exposed outside of the extension sources must be exported from here, because
 * everything else will be in private modules in extension.bundle.js.
 */

// Exports for tests
// The tests are not packaged with the webpack bundle and therefore only have access to code exported from this file.
//
// The tests should import '../extension.bundle'. At design-time they live in tests/ and so will pick up this file (extension.bundle.ts).
// At runtime the tests live in dist/tests and will therefore pick up the main webpack bundle at dist/extension.bundle.js.
export * from '@microsoft/vscode-azext-utils';
// Export activate/deactivate for main.js
export * from './src/commands/createManagedEnvironment/createManagedEnvironment';
export * from './src/commands/deployWorkspaceProject/deployWorkspaceProject';
export * from './src/commands/deployWorkspaceProject/getDeployWorkspaceProjectResults';
export * from './src/commands/deployWorkspaceProject/internal/DeployWorkspaceProjectInternalContext';
export * from './src/commands/deployWorkspaceProject/settings/DeployWorkspaceProjectSettingsV1';
export * from './src/commands/deployWorkspaceProject/settings/DeployWorkspaceProjectSettingsV2';
export * from './src/commands/deployWorkspaceProject/settings/dwpSettingUtilsV1';
export * from './src/commands/deployWorkspaceProject/settings/dwpSettingUtilsV2';
export * from './src/commands/IContainerAppContext';
export * from './src/commands/image/imageSource/containerRegistry/acr/createAcr/createAcr';
export * from './src/commands/ingress/editTargetPort/getDefaultPort';
export * from './src/commands/ingress/IngressContext';
export * from './src/commands/ingress/IngressPromptStep';
export * from './src/commands/ingress/tryGetDockerfileExposePorts';
export { activate, deactivate } from './src/extension';
export * from './src/extensionVariables';
export * from './src/utils/azureClients';
export * from './src/utils/imageNameUtils';
export * from './src/utils/settingUtils';
export * from './src/utils/validateUtils';

// NOTE: The auto-fix action "source.organizeImports" does weird things with this file, but there doesn't seem to be a way to disable it on a per-file basis so we'll just let it happen
