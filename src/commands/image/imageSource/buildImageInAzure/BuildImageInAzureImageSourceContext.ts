/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type SourceUploadDefinition } from '@azure/arm-containerregistry';
import type * as vscode from 'vscode';
import { type BuildImageInAzureTelemetryProps as TelemetryProps } from '../../../../telemetry/ImageSourceTelemetryProps';
import { type SetTelemetryProps } from '../../../../telemetry/SetTelemetryProps';
import { type ContainerRegistryImageSourceBaseContext } from '../containerRegistry/ContainerRegistryImageSourceContext';
import { type AcrBuildSupportedOS } from './OSPickStep';

export interface BuildImageInAzureImageSourceBaseContext extends ContainerRegistryImageSourceBaseContext {
    rootFolder: vscode.WorkspaceFolder;
    srcPath: string;
    dockerfilePath: string;
    imageName: string;
    os: AcrBuildSupportedOS;

    uploadedSourceLocation: SourceUploadDefinition;
    tarFilePath: string;

    client: ContainerRegistryManagementClient;
    resourceGroupName: string;
    registryName: string;
}

export type BuildImageInAzureImageSourceContext = BuildImageInAzureImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;
