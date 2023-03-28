/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { dockerHubDomain, dockerHubRegistry } from "../../../constants";
import { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";

interface RegistryCredentialsAndSecrets {
    registries?: RegistryCredentials[];
    secrets?: Secret[];
}

export async function getAcrCredentialsAndSecrets(context: IContainerRegistryImageContext, containerAppSettings?: RegistryCredentialsAndSecrets): Promise<RegistryCredentialsAndSecrets> {
    const registry = nonNullProp(context, 'registry');
    const { username, password } = await listCredentialsFromRegistry(context, registry);
    const passwordName = `${registry.name?.toLocaleLowerCase()}-${password?.name}`;

    // Remove duplicate registries
    const registries: RegistryCredentials[] = containerAppSettings?.registries?.filter(r => r.server !== registry.loginServer) ?? [];
    registries?.push(
        {
            server: registry.loginServer,
            username: username,
            passwordSecretRef: passwordName
        }
    );

    // Remove duplicate secrets
    const secrets: Secret[] = containerAppSettings?.secrets?.filter(s => s.name !== passwordName) ?? [];
    secrets?.push({ name: passwordName, value: password.value });

    return { registries, secrets };
}

export function getThirdPartyCredentialsAndSecrets(context: IContainerRegistryImageContext, containerAppSettings?: RegistryCredentialsAndSecrets): RegistryCredentialsAndSecrets {
    // If 'docker.io', convert to 'index.docker.io', else use registryName as loginServer
    const loginServer: string = (context.registryDomain === dockerHubDomain) ? dockerHubRegistry : nonNullProp(context, 'registryName').toLowerCase();
    const passwordSecretRef: string = `${loginServer.replace(/[\.]+/g, '')}-${context.username}`;

    // Remove duplicate registries
    const registries: RegistryCredentials[] = containerAppSettings?.registries?.filter(r => r.server !== loginServer) ?? [];
    registries?.push(
        {
            server: loginServer,
            username: context.username,
            passwordSecretRef
        }
    );

    // Remove duplicate secrets
    const secrets: Secret[] = containerAppSettings?.secrets?.filter(s => s.name !== passwordSecretRef) ?? [];
    secrets?.push(
        {
            name: passwordSecretRef,
            value: context.secret
        }
    );

    return { registries, secrets };
}
