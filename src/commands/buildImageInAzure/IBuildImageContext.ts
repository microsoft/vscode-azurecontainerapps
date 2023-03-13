/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, Run as AcrRun } from '@azure/arm-containerregistry';
import * as vscode from 'vscode';
import { IContainerAppContext } from '../createContainerApp/IContainerAppContext';
import { IDeployFromRegistryContext } from '../deploy/deployFromRegistry/IDeployFromRegistryContext';
import { Item } from "./DockerFileItemStep";

export interface IBuildImageContext extends IContainerAppContext, IDeployFromRegistryContext {
    rootFolder: vscode.WorkspaceFolder;
    dockerFile: Item;
    imageName: string;
    os: string;

    uploadedSourceLocation: string;
    tarFilePath: string;

    client: ContainerRegistryManagementClient;
    resourceGroupName: string;
    registryName: string;
    run: AcrRun
}
