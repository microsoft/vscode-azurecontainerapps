/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Run as AcrRun, ContainerRegistryManagementClient } from '@azure/arm-containerregistry';
import * as vscode from 'vscode';
import { IContainerRegistryImageContext } from '../containerRegistry/IContainerRegistryImageContext';

export interface IBuildImageInAzureContext extends IContainerRegistryImageContext {
    rootFolder: vscode.WorkspaceFolder;
    dockerFilePath: string;
    imageName: string;
    os: 'Windows' | 'Linux';

    uploadedSourceLocation: string;
    tarFilePath: string;

    client: ContainerRegistryManagementClient;
    resourceGroupName: string;
    registryName: string;
    run: AcrRun
}
