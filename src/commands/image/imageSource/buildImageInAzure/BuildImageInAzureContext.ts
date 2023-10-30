/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Run as AcrRun, ContainerRegistryManagementClient } from '@azure/arm-containerregistry';
import * as vscode from 'vscode';
import type { BuildImageInAzureTelemetryProps as TelemetryProps } from '../../../../telemetry/ImageSourceTelemetryProps';
import type { SetTelemetryProps } from '../../../../telemetry/SetTelemetryProps';
import { ContainerRegistryImageSourceBaseContext } from '../containerRegistry/ContainerRegistryImageSourceContext';
import type { AcrBuildSupportedOS } from './OSPickStep';

export interface BuildImageInAzureImageSourceBaseContext extends ContainerRegistryImageSourceBaseContext {
    rootFolder: vscode.WorkspaceFolder;
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
