/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AzureExtensionApi } from "@microsoft/vscode-azureresources-api";

export interface AzureContainerAppsExtensionApi extends Required<AzureExtensionApi> {
    deployImage(options: DeployImageToAcaOptionsContract): Promise<void>;
    deployWorkspaceProject(options: DeployWorkspaceProjectOptionsContract): Promise<DeployWorkspaceProjectResults>;
}

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
export interface DeployImageToAcaOptionsContract {
    image: string;
    registryName: string;
    username?: string;
    secret?: string;
}

export interface DeployWorkspaceProjectOptionsContract {
    // Existing resources
    subscriptionId?: string;
    resourceGroupId?: string;
    location?: string;

    // Workspace deployment paths (absolute fs path)
    rootPath?: string;
    srcPath?: string;
    dockerfilePath?: string;

    // Options
    suppressConfirmation?: boolean;  // Suppress any [resource] confirmation prompts
    suppressContainerAppCreation?: boolean;
    shouldSaveDeploySettings?: boolean;
}

export interface DeployWorkspaceProjectResults {
    resourceGroupId?: string;
    logAnalyticsWorkspaceId?: string;
    managedEnvironmentId?: string;
    containerAppId?: string;

    // ACR
    registryId?: string;
    registryLoginServer?: string;
    registryUsername?: string;
    registryPassword?: string;
    imageName?: string;
}
