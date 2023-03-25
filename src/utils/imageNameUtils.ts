/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { SupportedRegistries, acrDomain, dockerHubDomain } from "../constants";
import { createContainerRegistryManagementClient } from "./azureClients";

interface ParsedImageName {
    referenceImageName?: string;
    registryDomain?: string;
    registryName?: string;
    namespace?: string;
    image?: string;
    tag?: string;
}

export function parseImageName(imageName?: string): ParsedImageName {
    if (!imageName) {
        return {};
    }

    const match: RegExpMatchArray | null = imageName.match(/^(?:(?<registryName>[^/]+)\/)?(?:(?<namespace>[^/]+)\/)?(?<image>[^/:]+)(?::(?<tag>[^/]+))?$/);
    return {
        referenceImageName: imageName,
        registryDomain: match?.groups?.registryName ? detectRegistryDomain(match.groups.registryName) : undefined,
        registryName: match?.groups?.registryName,
        namespace: match?.groups?.namespace,
        image: match?.groups?.image,
        tag: match?.groups?.tag
    };
}

/**
 * @param registryName When parsed from a full image name, everything before the first slash
 */
export function detectRegistryDomain(registryName: string): SupportedRegistries | undefined {
    if (/\.azurecr\.io$/i.test(registryName)) {
        return acrDomain;
    } else if (/^docker\.io$/i.test(registryName)) {
        return dockerHubDomain;
    } else {
        return undefined;
    }
}

/**
 * @param acrName When parsed from a full ACR image name, everything before the first slash
 */
export async function getRegistryFromAcrName(context: ISubscriptionActionContext, acrName: string): Promise<Registry> {
    const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
    const registries = await uiUtils.listAllIterator(client.registries.list());
    return registries.find(r => r.loginServer === acrName) as Registry;
}
