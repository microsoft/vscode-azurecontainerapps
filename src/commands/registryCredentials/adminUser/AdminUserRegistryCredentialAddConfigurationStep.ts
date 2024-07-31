/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, dockerHubDomain, dockerHubRegistry, type SupportedRegistries } from "../../../constants";
import { type AdminUserRegistryCredentialsContext } from "./AdminUserRegistryCredentialsContext";
import { listCredentialsFromRegistry } from "./listCredentialsFromRegistry";

interface RegistryCredentialAndSecret {
    registryCredential: RegistryCredentials;
    secret: Secret;
}

export class AdminUserRegistryCredentialAddConfigurationStep extends AzureWizardExecuteStep<AdminUserRegistryCredentialsContext> {
    public priority: number = 470;

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: AdminUserRegistryCredentialsContext): Promise<void> {
        if (this.supportedRegistryDomain === acrDomain) {
            // ACR
            const acrRegistryCredentialAndSecret: RegistryCredentialAndSecret = await this.getAcrCredentialAndSecret(context);
            context.newRegistryCredential = acrRegistryCredentialAndSecret.registryCredential;
            context.newRegistrySecret = acrRegistryCredentialAndSecret.secret;
        } else {
            // Docker Hub or other third party registry...
            if (context.registryName && context.username && context.secret) {
                const thirdPartyRegistryCredentialAndSecret: RegistryCredentialAndSecret = this.getThirdPartyRegistryCredentialAndSecret(context);
                context.newRegistryCredential = thirdPartyRegistryCredentialAndSecret.registryCredential;
                context.newRegistrySecret = thirdPartyRegistryCredentialAndSecret.secret;
            }
        }
    }

    public shouldExecute(context: AdminUserRegistryCredentialsContext): boolean {
        return !context.newRegistryCredential || !context.newRegistrySecret;
    }

    private async getAcrCredentialAndSecret(context: AdminUserRegistryCredentialsContext): Promise<RegistryCredentialAndSecret> {
        const registry = nonNullProp(context, 'registry');
        const { username, password } = await listCredentialsFromRegistry(context);
        const passwordName = `${registry.name?.toLocaleLowerCase()}-${password?.name}`;

        return {
            registryCredential: {
                identity: '', // The server populates an `undefined` identity as ''.  Use the same convention so we can do deep copy comparisons later.
                server: registry.loginServer,
                username: username,
                passwordSecretRef: passwordName
            },
            secret: {
                name: passwordName,
                value: password.value,
            },
        };
    }

    private getThirdPartyRegistryCredentialAndSecret(context: AdminUserRegistryCredentialsContext): RegistryCredentialAndSecret {
        // If 'docker.io', convert to 'index.docker.io', else use registryName as loginServer
        const loginServer: string = (this.supportedRegistryDomain === dockerHubDomain) ? dockerHubRegistry : nonNullProp(context, 'registryName').toLowerCase();
        const passwordSecretRef: string = `${loginServer.replace(/[^a-z0-9-]+/g, '')}-${context.username}`;

        return {
            registryCredential: {
                identity: '', // The server populates an `undefined` identity as ''.  Use the same convention so we can do deep copy comparisons later.
                server: loginServer,
                username: context.username,
                passwordSecretRef
            },
            secret: {
                name: passwordSecretRef,
                value: context.secret
            },
        };
    }
}
