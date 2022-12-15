/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomain, acrDomainRegExp, dockerHubDomain, dockerHubDomainRegExp, SupportedRegistries } from "../constants";
import { createContainerRegistryManagementClient } from "./azureClients";
import { localize } from "./localize";

export namespace imageNameUtils {
    export function detectRegistryDomain(imageName: string): SupportedRegistries | undefined {
        if (acrDomainRegExp.test(imageName)) {
            return acrDomain;
        } else if (dockerHubDomainRegExp.test(imageName)) {
            return dockerHubDomain;
        } else {
            return undefined;
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
