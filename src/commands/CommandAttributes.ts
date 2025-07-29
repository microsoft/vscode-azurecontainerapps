/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ActivityAttributes } from "@microsoft/vscode-azext-utils";

export class CommandAttributes {

    static readonly DeployContainerAppContainerRegistry: ActivityAttributes = {
        description: `Deploys an existing image from a container registry to a target Azure Container App.
            The container registry and image must already be available for pulling.
            Supports public images from any registry, and both public and private images from Azure Container Registry (ACR).
            For private image deployment from other third party registries, we support deployment through the 'vscode-containers' extension
            via the command titled "Container Registries: Deploy Image to Azure Container Apps...".`,
        troubleshooting: [
            `If a container app resource envelope is provided in attributes, do not confuse null secrets as missing container app secrets. This is because secrets are not typically
            copied over with the core resource metadata. Any issues with secrets will require inspecting the remote resource directly.`,
        ]
    };

    static readonly DeployWorkspaceProjectInternal: ActivityAttributes = {
        description: `Takes a workspace project with a Dockerfile and deploys it to an Azure Container App.
            Automatically creates any required resources (resource group, managed environment, container registry, container app, log analytics workspace).
            Supports single repo and monorepo, with deployment settings saved and reused via local VS Code settings (.vscode/settings.json).
            Deployment settings are saved under "containerApps.deploymentConfigurations".
            Deployment is agnostic to project runtime and language.`,
        troubleshooting: [
            `When ACR build errors are present, try to inspect the Dockerfile and ACR build logs.
            When an error is related to the Dockerfile, offer to make direct fixes for the user.`,
            `If a container app resource envelope is provided in attributes, do not confuse empty secrets as missing container app secrets. This is because secrets are not typically
            copied over with the core resource metadata. Any issues with secrets will require inspecting the remote resource directly.`,
        ],
    };
}
