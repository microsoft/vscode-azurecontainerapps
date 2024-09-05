/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type RegistryPassword } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, nonNullValue, nonNullValueAndProp, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../utils/azureClients";
import { type RegistryCredentialsContext } from "../RegistryCredentialsContext";

export async function listCredentialsFromAcr(context: ISubscriptionActionContext & Partial<RegistryCredentialsContext>): Promise<{ username: string, password: RegistryPassword }> {
    const containerClient: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
    const credentials = await containerClient.registries.listCredentials(getResourceGroupFromId(nonNullValueAndProp(context.registry, 'id')), nonNullValueAndProp(context.registry, 'name'));
    const password = credentials.passwords?.find(cred => cred.name === 'password' || cred.name === 'password2');
    return { username: nonNullProp(credentials, 'username'), password: nonNullValue(password) };
}
