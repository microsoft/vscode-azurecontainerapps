/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry, type RegistryPassword } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, nonNullValue, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";

export async function listCredentialsFromRegistry(context: ISubscriptionActionContext & Partial<ContainerRegistryImageSourceContext>, registry: Registry):
    Promise<{ username: string, password: RegistryPassword }> {

    const containerClient: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
    const credentials = await containerClient.registries.listCredentials(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'));
    const password = credentials.passwords?.find(cred => cred.name === 'password' || cred.name === 'password2');
    return { username: nonNullProp(credentials, 'username'), password: nonNullValue(password) };
}

