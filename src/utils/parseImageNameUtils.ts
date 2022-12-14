/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomainRegExp, dockerHubDomainRegExp, RegistryTypes } from "../constants";
import { createContainerRegistryManagementClient } from "./azureClients";
import { localize } from "./localize";

export namespace imageNameUtils {
    export function detectRegistryType(imageName: string): RegistryTypes {
        if (acrDomainRegExp.test(imageName)) {
            return RegistryTypes.ACR;
        } else if (dockerHubDomainRegExp.test(imageName)) {
            return RegistryTypes.DH;
        } else {
            return RegistryTypes.Custom;
        }
    }

    export async function getRegistryFromAcrName(context: ISubscriptionActionContext, acrImageName: string): Promise<ContainerRegistryManagementModels.Registry> {
        const args: string[] = acrImageName.split('/');
        if (args.length !== 2) {
            throw new Error(localize('invalidAcrImageName', 'Invalid Azure Container Registry image name.'));
        }

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await client.registries.list();
        return registries.find(r => r.loginServer === args[0]) as ContainerRegistryManagementModels.Registry;
    }
}
