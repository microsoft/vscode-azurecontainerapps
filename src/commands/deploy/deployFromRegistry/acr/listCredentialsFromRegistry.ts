/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, Registry, RegistryPassword } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { createContainerRegistryManagementClient } from "../../../../utils/azureClients";
import { nonNullProp, nonNullValue } from "../../../../utils/nonNull";
import { IDeployFromRegistryContext } from "../IDeployFromRegistryContext";

export async function listCredentialsFromRegistry(context: IDeployFromRegistryContext, registry: Registry):
    Promise<{ username: string, password: RegistryPassword }> {

    const containerClient: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
    const credentials = await containerClient.registries.listCredentials(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'));
    const password = credentials.passwords?.find(cred => cred.name === 'password' || cred.name === 'password2');
    return { username: nonNullProp(credentials, 'username'), password: nonNullValue(password) };
}

