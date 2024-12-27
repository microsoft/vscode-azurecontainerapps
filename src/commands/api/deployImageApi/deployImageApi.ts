/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithMaskHandling, callWithTelemetryAndErrorHandling, createSubscriptionContext, type IActionContext, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, acrDomain } from "../../../constants";
import { getDomainFromRegistryName, getRegistryFromAcrName } from "../../../utils/imageNameUtils";
import { pickContainer } from "../../../utils/pickItem/pickContainer";
import { deployImage } from "../../deployImage/deployImage";
import { type ContainerRegistryImageSourceContext } from "../../image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type DeployImageToAcaOptionsContract } from "../vscode-azurecontainerapps.api";

export async function deployImageApi(deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    return await callWithTelemetryAndErrorHandling('containerApps.api.deployImage', async (context: IActionContext & Partial<ContainerRegistryImageSourceContext>) => {
        const node = await pickContainer(context);
        const { subscription } = node;

        Object.assign(context, { ...createSubscriptionContext(subscription), imageSource: ImageSource.ContainerRegistry }, deployImageOptions);

        context.registryDomain = getDomainFromRegistryName(deployImageOptions.registryName);
        if (context.registryDomain === acrDomain) {
            context.registry = await getRegistryFromAcrName(<ISubscriptionActionContext>context, deployImageOptions.registryName);
        }

        // Mask sensitive data
        if (deployImageOptions.secret) {
            context.valuesToMask.push(deployImageOptions.secret);
        }
        if (deployImageOptions.username) {
            context.valuesToMask.push(deployImageOptions.username);
        }
        context.valuesToMask.push(deployImageOptions.image);

        if (deployImageOptions.secret) {
            context.telemetry.properties.hasRegistrySecrets = 'true';
            return callWithMaskHandling<void>(() => deployImage(context, node), deployImageOptions.secret);
        } else {
            context.telemetry.properties.hasRegistrySecrets = 'false';
            return deployImage(context, node);
        }
    });
}
