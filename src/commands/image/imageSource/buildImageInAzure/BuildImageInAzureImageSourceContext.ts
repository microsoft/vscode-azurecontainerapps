/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Run as AcrRun, type ContainerRegistryManagementClient } from '@azure/arm-containerregistry';
import type * as vscode from 'vscode';
import { type BuildImageInAzureTelemetryProps as TelemetryProps } from '../../../../telemetry/ImageSourceTelemetryProps';
import { type SetTelemetryProps } from '../../../../telemetry/SetTelemetryProps';
import { type ContainerRegistryImageSourceBaseContext } from '../containerRegistry/ContainerRegistryImageSourceContext';
import { type AcrBuildSupportedOS } from './OSPickStep';

// Todo: Investigate if these properties should actually be optional
export interface BuildImageInAzureImageSourceBaseContext extends ContainerRegistryImageSourceBaseContext {
    rootFolder: vscode.WorkspaceFolder;
    srcPath: string;
    dockerfilePath: string;
    imageName: string;
    os: AcrBuildSupportedOS;

    uploadedSourceLocation: string;
    tarFilePath: string;

    client: ContainerRegistryManagementClient;
    resourceGroupName: string;
    registryName: string;
    run: AcrRun;
}

export type BuildImageInAzureImageSourceContext = BuildImageInAzureImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;
