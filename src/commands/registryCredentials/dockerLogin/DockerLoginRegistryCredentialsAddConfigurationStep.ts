/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, dockerHubDomain, dockerHubRegistry, type SupportedRegistries } from "../../../constants";
import { type DockerLoginRegistryCredentialsContext } from "./DockerLoginRegistryCredentialsContext";
import { listCredentialsFromAcr } from "./listCredentialsFromAcr";

interface RegistryCredentialAndSecret {
    registryCredential: RegistryCredentials;
    secret: Secret;
}

export class DockerLoginRegistryCredentialsAddConfigurationStep extends AzureWizardExecuteStep<DockerLoginRegistryCredentialsContext> {
    public priority: number = 470;

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: DockerLoginRegistryCredentialsContext): Promise<void> {
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

    public shouldExecute(context: DockerLoginRegistryCredentialsContext): boolean {
        return !context.newRegistryCredential || !context.newRegistrySecret;
    }

    private async getAcrCredentialAndSecret(context: DockerLoginRegistryCredentialsContext): Promise<RegistryCredentialAndSecret> {
        const registry = nonNullProp(context, 'registry');
        const { username, password } = await listCredentialsFromAcr(context);
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

    private getThirdPartyRegistryCredentialAndSecret(context: DockerLoginRegistryCredentialsContext): RegistryCredentialAndSecret {
        // If 'docker.io', convert to 'index.docker.io', else use registryName as loginServer
        const loginServer: string = DockerLoginRegistryCredentialsAddConfigurationStep.getThirdPartyLoginServer(
            this.supportedRegistryDomain as typeof dockerHubDomain | undefined,
            nonNullProp(context, 'registryName'),
        );
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

    public static getThirdPartyLoginServer(registryDomain: typeof dockerHubDomain | undefined, registryName: string): string {
        return (registryDomain === dockerHubDomain) ? dockerHubRegistry : registryName.toLowerCase();
    }
}
