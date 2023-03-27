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
    repositoryName?: string;
    tag?: string;
}

/**
 * @param imageName The full image name, including any registry, namespace, repository, and tag
 *
 * @example
 * Format: '<registryName>/<...namespaces>/<repositoryName>:<tagName>'
 * ACR: 'acrRegistryName.azurecr.io/repositoryName:tagName'
 * DH: 'docker.io/namespace/repositoryName:tagName'
 *
 * @returns A 'ParsedImageName' with the following properties:
 * (1) 'referenceImageName': The original full image name;
 * (2) 'registryDomain': The 'SupportedRegistries' domain, if it can be determined from the 'registryName';
 * (3) 'registryName': Everything before the first slash;
 * (4) 'namespace': Everything between the 'registryName' and the 'repositoryName', including intermediate slashes;
 * (5) 'repositoryName': Everything after the last slash (until the tag, if it is present);
 * (6) 'tag': Everything after the ":", if it is present
 */
export function parseImageName(imageName?: string): ParsedImageName {
    if (!imageName) {
        return {};
    }

    const match: RegExpMatchArray | null = imageName.match(/^(?:(?<registryName>[^/]+)\/)?(?:(?<namespace>[^/]+(?:\/[^/]+)*)\/)?(?<repositoryName>[^/:]+)(?::(?<tag>[^/]+))?$/);
    return {
        referenceImageName: imageName,
        registryDomain: match?.groups?.registryName ? detectRegistryDomain(match.groups.registryName) : undefined,
        registryName: match?.groups?.registryName,
        namespace: match?.groups?.namespace,
        repositoryName: match?.groups?.repositoryName,
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
