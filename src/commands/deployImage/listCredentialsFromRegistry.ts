/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { createContainerRegistryManagementClient } from "../../utils/azureClients";
import { getResourceGroupFromId } from "../../utils/azureUtils";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IDeployImageContext } from "./IDeployImageContext";

export async function listCredentialsFromRegistry(context: IDeployImageContext, registry: ContainerRegistryManagementModels.Registry):
    Promise<{ username: string, password: ContainerRegistryManagementModels.RegistryPassword }> {

    const containerClient: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
    const credentials = await containerClient.registries.listCredentials(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'));
    const password = credentials.passwords?.find(cred => cred.name === 'password' || cred.name === 'password2');
    return { username: nonNullProp(credentials, 'username'), password: nonNullValue(password) };
}

