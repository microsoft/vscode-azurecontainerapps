/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../../constants";
import { getContainerEnvelopeWithSecrets } from "../../../../tree/ContainerAppItem";
import { parseImageName } from "../../../../utils/imageNameUtils";
import type { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";
import { getLoginServer } from "./getLoginServer";
import { getAcrCredentialsAndSecrets, getThirdPartyCredentialsAndSecrets } from "./getRegistryCredentialsAndSecrets";

export class ContainerRegistryImageConfigureStep extends AzureWizardExecuteStep<IContainerRegistryImageContext> {
    public priority: number = 470;

    // Configures base image attributes
    public async execute(context: IContainerRegistryImageContext): Promise<void> {
        // Store any existing secrets and registries
        let secrets: Secret[] | undefined;
        let registries: RegistryCredentials[] | undefined;

        if (context.containerApp) {
            // Grab existing app secrets and registry credentials
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

        // Preserve existing secrets/registries even if new ones haven't been added
        context.secrets ??= secrets;
        context.registries ??= registries;

        context.image ||= `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;
        context.telemetry.properties.registryName = parseImageName(context.image).registryName;
    }

    public shouldExecute(): boolean {
        return true;
    }
}
