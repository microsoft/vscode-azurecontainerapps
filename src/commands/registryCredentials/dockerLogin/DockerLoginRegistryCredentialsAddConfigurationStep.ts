/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, dockerHubDomain, dockerHubRegistry, type SupportedRegistries } from "../../../constants";
import { localize } from "../../../utils/localize";
import { AzureWizardActivityOutputExecuteStep } from "../../AzureWizardActivityOutputExecuteStep";
import { type DockerLoginRegistryCredentialsContext } from "./DockerLoginRegistryCredentialsContext";
import { listCredentialsFromAcr } from "./listCredentialsFromAcr";

interface RegistryCredentialAndSecret {
    registryCredential: RegistryCredentials;
    secret: Secret;
}

export class DockerLoginRegistryCredentialsAddConfigurationStep<T extends DockerLoginRegistryCredentialsContext> extends AzureWizardActivityOutputExecuteStep<T> {
    public priority: number = 470;
    public stepName: string = 'dockerLoginRegistryCredentialsAddConfigurationStep';
    protected getSuccessString = (context: T) => localize('createRegistryCredentialSuccess', 'Successfully added registry credential for "{0}" (Docker login).', context.newRegistryCredential?.server);
    protected getFailString = () => localize('createRegistryCredentialFail', 'Failed to add registry credential (Docker login).');
    protected getTreeItemLabel = (context: T) => localize('createRegistryCredentialLabel', 'Add registry credential for "{0}" (Docker login)', context.newRegistryCredential?.server);

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: T): Promise<void> {
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

    public shouldExecute(context: T): boolean {
        return !context.newRegistryCredential || !context.newRegistrySecret;
    }

    private async getAcrCredentialAndSecret(context: T): Promise<RegistryCredentialAndSecret> {
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

    private getThirdPartyRegistryCredentialAndSecret(context: T): RegistryCredentialAndSecret {
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
