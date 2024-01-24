/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryPassword } from "@azure/arm-containerregistry";
import type * as api from "../api/vscode-azurecontainerapps.api";
import { listCredentialsFromRegistry } from "../image/imageSource/containerRegistry/acr/listCredentialsFromRegistry";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";

export type DeployWorkspaceProjectResults = api.DeployWorkspaceProjectResults;

export async function getDeployWorkspaceProjectResults(context: DeployWorkspaceProjectContext): Promise<DeployWorkspaceProjectResults> {
    const registryCredentials: { username: string, password: RegistryPassword } | undefined = context.registry ?
        await listCredentialsFromRegistry(context, context.registry) : undefined;

    return {
        resourceGroupId: context.resourceGroup?.id,
        logAnalyticsWorkspaceId: context.logAnalyticsWorkspace?.id,
        managedEnvironmentId: context.managedEnvironment?.id,
        containerAppId: context.containerApp?.id,
        registryId: context.registry?.id,
        registryLoginServer: context.registry?.loginServer,
        registryUsername: registryCredentials?.username,
        registryPassword: registryCredentials?.password.value,
        imageName: context.imageName
    };
}
