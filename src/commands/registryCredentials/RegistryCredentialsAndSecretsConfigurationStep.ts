/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { getContainerEnvelopeWithSecrets } from "../../tree/ContainerAppItem";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export class RegistryCredentialsAndSecretsConfigurationStep extends AzureWizardExecuteStep<RegistryCredentialsContext> {
    public priority: number = 470;

    public async execute(context: RegistryCredentialsContext): Promise<void> {
        let secrets: Secret[] = [];
        let registryCredentials: RegistryCredentials[] = [];

        if (context.containerApp) {
            // Grab existing app secrets and registry credentials
            const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, context.containerApp);
            secrets = containerAppEnvelope.configuration.secrets ?? [];
            registryCredentials = containerAppEnvelope.configuration.registries ?? [];
        }

        if (context.newRegistryCredential) {
            registryCredentials.push(context.newRegistryCredential);
        }

        if (context.newRegistrySecret) {
            secrets.push(nonNullProp(context, 'newRegistrySecret'));
        }

        context.secrets = secrets;
        context.registryCredentials = registryCredentials;
    }

    public shouldExecute(context: RegistryCredentialsContext): boolean {
        return !context.registryCredentials || !context.secrets;
    }
}
