/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { getContainerEnvelopeWithSecrets } from "../../tree/ContainerAppItem";
import { type RevisionDraftContext } from "../revisionDraft/RevisionDraftContext";
import { mergeRegistryConfiguration, type RegistryConfiguration } from "./mergeRegistryConfiguration";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export class RegistryCredentialsAndSecretsConfigurationStep extends AzureWizardExecuteStep<RegistryCredentialsContext> {
    public priority: number = 480;

    public async execute(context: RegistryCredentialsContext & Partial<RevisionDraftContext>): Promise<void> {
        const newConfiguration = {
            registries: context.newRegistryCredential ? [context.newRegistryCredential] : [],
            secrets: context.newRegistrySecret ? [context.newRegistrySecret] : [],
            managedIdentityIds: context.managedIdentity?.id ? [context.managedIdentity.id] : [],
        };

        if (context.isDraftCommand) {
            if (context.newRegistryCredential || context.newRegistrySecret) {
                context.registryConfiguration = mergeRegistryConfiguration(context.registryConfiguration, newConfiguration);
            }
            return;
        }

        let currentConfiguration: Partial<RegistryConfiguration> | undefined;
        if (context.containerApp) {
            const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, context.containerApp);
            currentConfiguration = containerAppEnvelope.configuration;
        }

        const configuration = mergeRegistryConfiguration(currentConfiguration, newConfiguration);
        context.secrets = configuration.secrets;
        context.registryCredentials = configuration.registries;
    }

    public shouldExecute(context: RegistryCredentialsContext): boolean {
        return !!context.newRegistryCredential || !!context.newRegistrySecret || !context.registryCredentials || !context.secrets;
    }
}
