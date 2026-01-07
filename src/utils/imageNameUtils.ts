/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerRegistryImageSourceContext } from "../commands/image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { acrDomain, dockerHubDomain, type SupportedRegistries } from "../constants";
import { createContainerRegistryManagementClient } from "./azureClients";

interface ParsedImageName {
    imageNameReference?: string;
    registryDomain?: SupportedRegistries;
    registryName?: string;
    namespace?: string;
    repositoryName?: string;
    tag?: string;
}

/**
 * @param imageName The full image name, including any registry, namespace, repository, and tag
 *
 * @example
 * Format: '<registryName>/<...namespaces>/<repositoryName>:<tag>'
 * ACR: 'acrRegistryName.azurecr.io/repositoryName:tag'
 * DH: 'docker.io/namespace/repositoryName:tag'
 *
 * @returns A 'ParsedImageName' with the following properties:
 * (1) 'imageNameReference': The original full image name;
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
        imageNameReference: imageName,
        registryDomain: match?.groups?.registryName ? getDomainFromRegistryName(match.groups.registryName) : undefined,
        registryName: match?.groups?.registryName,
        namespace: match?.groups?.namespace,
        repositoryName: match?.groups?.repositoryName,
        tag: match?.groups?.tag
    };
}

export function getImageNameWithoutTag(imageName: string): string {
    return imageName.replace(/:[^:]*$/, '');
}

/**
 * @param registryName When parsed from a full image name, everything before the first slash
 */
export function getDomainFromRegistryName(registryName: string): SupportedRegistries | undefined {
    if (/\.azurecr\.io$/i.test(registryName)) {
        return acrDomain;
    } else if (/^docker\.io$/i.test(registryName)) {
        return dockerHubDomain;
    } else {
        return undefined;
    }
}

/**
 * A best effort attempt to obtain the registry domain using all available information on the context.
 * This function should only be called when we expect to have the full set of inputs necessary to make an informed decision.
 * It assumes that any missing or ambiguous information has already been addressed prior to the call.
 */
export function getRegistryDomainFromContext(context: Partial<ContainerRegistryImageSourceContext>): SupportedRegistries | undefined {
    switch (true) {
        case !!context.registryDomain:
            return context.registryDomain;
        case !!context.image: {
            const registryName: string | undefined = parseImageName(context.image).registryName;
            return registryName ? getDomainFromRegistryName(registryName) : undefined;
        }
        case !!context.registry?.loginServer || !!context.registryName:
            return getDomainFromRegistryName(context.registry?.loginServer || nonNullProp(context, 'registryName'));
        default:
            // If no image by this point, assume we're creating a new ACR
            return acrDomain;
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
