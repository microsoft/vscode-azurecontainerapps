/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomainRegExp, dockerHubDomain, dockerHubDomainRegExp, RegistryTypes } from "../constants";
import { createContainerRegistryManagementClient } from "./azureClients";
import { localize } from "./localize";

export interface IParsedImageNameAttributes {
    image: string;
    repositoryName: string;
    tag: string;
}

export interface IParsedDockerImageNameAttributes extends IParsedImageNameAttributes {
    dockerHubNamespace: string;
}

export interface IParsedAcrImageNameAttributes extends IParsedImageNameAttributes {
    registry: ContainerRegistryManagementModels.Registry;
}

export namespace imageNameUtils {
    export function detectRegistryType(imageName: string, loginServer?: string): RegistryTypes {
        if (acrDomainRegExp.test(imageName)) {
            return RegistryTypes.ACR;
        } else if (dockerHubDomainRegExp.test(imageName) || (loginServer && /Docker/i.test(loginServer))) {
            // 'imageName' does not always come with a reference to 'docker' or 'docker.io', so we should do a backup check against the 'loginServer' for this info
            return RegistryTypes.DH;
        } else {
            return RegistryTypes.Custom;
        }
    }

    export async function parseFromAcrName(context: ISubscriptionActionContext, acrImageName: string): Promise<IParsedAcrImageNameAttributes> {
        if (acrImageName.split('/').length !== 2) {
            throw new Error(localize('invalidAcrImageName', 'Invalid Azure Container Registry image name format.'));
        }

        const attributes: string[] = acrImageName.split('/');
        const loginServer: string = attributes[0];
        const [repositoryName, tag] = attributes[1].split(':');

        return {
            image: acrImageName,
            registry: await getAcrRegistry(context, loginServer),
            repositoryName,
            tag
        };
    }

    async function getAcrRegistry(context: ISubscriptionActionContext, loginServer: string): Promise<ContainerRegistryManagementModels.Registry> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await client.registries.list();
        return registries.find(r => r.loginServer === loginServer) as ContainerRegistryManagementModels.Registry;
    }

    export function parseFromDockerHubName(dockerHubImageName: string): IParsedDockerImageNameAttributes {
        const args: number = dockerHubImageName.split('/').length;

        if (args < 2 || args > 3) {
            throw new Error(localize('invalidDockerHubImageName', 'Invalid Docker Hub image name format.'));
        } else if (args === 2) {
            // Standardize Docker Hub images names with the prefix: 'docker.io/...'
            dockerHubImageName = dockerHubDomain + '/' + dockerHubImageName;
        }

        const attributes: string[] = dockerHubImageName.split('/');
        const [repositoryName, tag] = attributes[2].split(':');

        return {
            image: dockerHubImageName,
            dockerHubNamespace: attributes[1],
            repositoryName,
            tag
        };
    }
}
