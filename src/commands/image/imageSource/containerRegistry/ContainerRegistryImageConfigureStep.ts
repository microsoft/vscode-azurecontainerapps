/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../../constants";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";
import { getAcrCredentialsAndSecrets, getThirdPartyCredentialsAndSecrets } from "./getRegistryCredentialsAndSecrets";

export class ContainerRegistryImageConfigureStep extends AzureWizardExecuteStep<ContainerRegistryImageSourceContext> {
    public priority: number = 480; // Todo: Revisit this priority

    // Configures base container attributes
    public async execute(context: ContainerRegistryImageSourceContext): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        const secrets: Secret[] | undefined = containerAppEnvelope.configuration.secrets;
        const registries: RegistryCredentials[] | undefined = containerAppEnvelope.configuration.registries;

        if (context.registryDomain === acrDomain) {
            // ACR
            const acrRegistryCredentialsAndSecrets = await getAcrCredentialsAndSecrets(context, { registries, secrets });
            context.secrets = acrRegistryCredentialsAndSecrets.secrets;
            context.registries = acrRegistryCredentialsAndSecrets.registries;
        } else {
            // Docker Hub or other third party registry...
            if (context.registryName && context.username && context.secret) {
                const thirdPartyRegistryCredentialsAndSecrets = getThirdPartyCredentialsAndSecrets(context, { registries, secrets });
                context.secrets = thirdPartyRegistryCredentialsAndSecrets.secrets;
                context.registries = thirdPartyRegistryCredentialsAndSecrets.registries;
            }
        }

        // Preserve existing secrets/registries even if new ones haven't been added
        context.secrets ??= secrets;
        context.registries ??= registries;
        context.image ||= `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';
    }

    public shouldExecute(context: ContainerRegistryImageSourceContext): boolean {
        return !!context.containerApp;
    }
}
