/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../../constants";
import { getContainerEnvelopeWithSecrets } from "../../../../tree/ContainerAppItem";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";
import { getAcrCredentialsAndSecrets, getThirdPartyCredentialsAndSecrets } from "./getRegistryCredentialsAndSecrets";

export class ContainerRegistryImageConfigureStep extends AzureWizardExecuteStep<ContainerRegistryImageSourceContext> {
    public priority: number = 550;

    public async execute(context: ContainerRegistryImageSourceContext): Promise<void> {
        let secrets: Secret[] | undefined;
        let registries: RegistryCredentials[] | undefined;

        if (context.containerApp) {
            const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, context.containerApp);
            secrets = containerAppEnvelope.configuration.secrets;
            registries = containerAppEnvelope.configuration.registries;
        }

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

        context.secrets ??= secrets;
        context.registries ??= registries;
        context.image ||= `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';
    }

    public shouldExecute(): boolean {
        return true;
    }
}
