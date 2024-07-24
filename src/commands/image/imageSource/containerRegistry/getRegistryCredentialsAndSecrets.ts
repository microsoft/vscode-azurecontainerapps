/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { dockerHubDomain, dockerHubRegistry } from "../../../../constants";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";

interface RegistryCredentialsAndSecrets {
    registries?: RegistryCredentials[];
    secrets?: Secret[];
}

export async function getAcrCredentialsAndSecrets(context: ContainerRegistryImageSourceContext, containerAppSettings?: RegistryCredentialsAndSecrets): Promise<RegistryCredentialsAndSecrets> {
    const registry = nonNullProp(context, 'registry');
    const { password } = await listCredentialsFromRegistry(context, registry);
    const passwordName = `${registry.name?.toLocaleLowerCase()}-${password?.name}`; // The old naming convention that was used before we migrated to using managed identities

    let registries: RegistryCredentials[];
    const existingRegistry: RegistryCredentials | undefined = containerAppSettings?.registries?.find(r => r.server && r.server === registry.loginServer);

    if (existingRegistry?.identity) {
        // If registry credential is already set up with a managed identity, leave as-is
        registries = containerAppSettings?.registries as RegistryCredentials[];
    } else {
        registries = containerAppSettings?.registries?.filter(r => r.server !== registry.loginServer) ?? [];
        registries?.push(
            {
                identity: 'system',
                server: registry.loginServer,
                username: '',
                passwordSecretRef: ''
            }
        );
    }

    // Remove any associated secrets registry credentials (should use managed identity instead)
    const secrets: Secret[] = containerAppSettings?.secrets?.filter(s => s.name !== passwordName) ?? [];
    return { registries, secrets };
}

export function getThirdPartyCredentialsAndSecrets(context: ContainerRegistryImageSourceContext, containerAppSettings?: RegistryCredentialsAndSecrets): RegistryCredentialsAndSecrets {
    // If 'docker.io', convert to 'index.docker.io', else use registryName as loginServer
    const loginServer: string = (context.registryDomain === dockerHubDomain) ? dockerHubRegistry : nonNullProp(context, 'registryName').toLowerCase();
    const passwordSecretRef: string = `${loginServer.replace(/[^a-z0-9-]+/g, '')}-${context.username}`;

    // Remove duplicate registries
    const registries: RegistryCredentials[] = containerAppSettings?.registries?.filter(r => r.server !== loginServer) ?? [];
    registries?.push(
        {
            identity: '', // The server populates an `undefined` identity as ''.  Use the same convention so we can do deep copy comparisons later.
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
