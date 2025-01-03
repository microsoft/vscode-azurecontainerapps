/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithMaskHandling, callWithTelemetryAndErrorHandling, createSubscriptionContext, type ExecuteActivityContext, type IActionContext, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, acrDomain } from "../../constants";
import { type DeployImageApiTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { getDomainFromRegistryName, getRegistryFromAcrName } from "../../utils/imageNameUtils";
import { pickContainer } from "../../utils/pickItem/pickContainer";
import { deployImage } from "../deployImage/deployImage";
import { type ContainerRegistryImageSourceContext } from "../image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type ImageSourceBaseContext } from "../image/imageSource/ImageSourceContext";
import { type DeployImageToAcaOptionsContract } from "./vscode-azurecontainerapps.api";

export type DeployImageApiContext = ImageSourceBaseContext & ExecuteActivityContext & SetTelemetryProps<TelemetryProps>;

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

/**
 * A compatibility wrapper for the legacy entrypoint utilizing `deployImageApi`
 */
export async function deployImageApiCompat(_: IActionContext & Partial<ContainerRegistryImageSourceContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    return await deployImageApi(deployImageOptions);
}
