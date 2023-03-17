/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Run as AcrRun, ContainerRegistryManagementClient } from '@azure/arm-containerregistry';
import * as vscode from 'vscode';
import { IDeployFromRegistryContext } from '../deployFromRegistry/IDeployFromRegistryContext';

export interface IBuildImageInAzureContext extends IDeployFromRegistryContext {
    rootFolder: vscode.WorkspaceFolder;
    dockerFilePath: string;
    imageName: string;
    os: string;

    uploadedSourceLocation: string;
    tarFilePath: string;

    client: ContainerRegistryManagementClient;
    resourceGroupName: string;
    registryName: string;
    run: AcrRun
}
