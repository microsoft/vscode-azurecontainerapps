/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials } from "@azure/arm-appcontainers";
import { type RegistryPassword } from "@azure/arm-containerregistry";
import type * as api from "../api/vscode-azurecontainerapps.api";
import { listCredentialsFromAcr } from "../registryCredentials/dockerLogin/listCredentialsFromAcr";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";

export type DeployWorkspaceProjectResults = api.DeployWorkspaceProjectResults;

export async function getDeployWorkspaceProjectResults(context: DeployWorkspaceProjectContext): Promise<DeployWorkspaceProjectResults> {
    const registryCredentials: RegistryCredentials | undefined = context.containerApp?.configuration?.registries?.find(r => r.server === context.registry?.loginServer);

    let listedCredentials: { username: string, password: RegistryPassword } | undefined;
    if (!registryCredentials?.identity) {
        listedCredentials = await listCredentialsFromAcr(context);
    }

    return {
        resourceGroupId: context.resourceGroup?.id,
        managedEnvironmentId: context.managedEnvironment?.id,
        containerAppId: context.containerApp?.id,
        registryId: context.registry?.id,
        registryLoginServer: context.registry?.loginServer,
        registryUsername: listedCredentials?.username,
        registryPassword: listedCredentials?.password.value,
        imageName: context.imageName
    };
}
