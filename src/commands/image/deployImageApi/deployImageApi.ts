/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext, ISubscriptionActionContext, callWithMaskHandling, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, acrDomain } from "../../../constants";
import { SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { DeployImageApiTelemetryProps as TelemetryProps } from "../../../telemetry/telemetryProps";
import { detectRegistryDomain, getRegistryFromAcrName } from "../../../utils/imageNameUtils";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import type { ImageSourceBaseContext } from "../imageSource/ImageSourceBaseContext";
import type { IContainerRegistryImageContext } from "../imageSource/containerRegistry/IContainerRegistryImageContext";
import { deployImage } from "./deployImage";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    image: string;
    registryName: string;
    username?: string;
    secret?: string;
}

export type DeployImageApiContext = ImageSourceBaseContext & ExecuteActivityContext & SetTelemetryProps<TelemetryProps>;

/**
 * A command shared with the `vscode-docker` extension.
 * It uses our old `deployImage` command flow which immediately tries to deploy the image to a container app without creating a draft.
 * This command cannot be used to bundle template changes.
 */
export async function deployImageApi(context: IActionContext & Partial<IContainerRegistryImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    const node = await pickContainerApp(context);
    const { subscription } = node;

    Object.assign(context, { ...createSubscriptionContext(subscription), imageSource: ImageSource.ContainerRegistry }, deployImageOptions);

    context.registryDomain = detectRegistryDomain(deployImageOptions.registryName);
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
        context.telemetry.properties.hasSecrets = 'true';
        return callWithMaskHandling<void>(() => deployImage(context, node), deployImageOptions.secret);
    } else {
        context.telemetry.properties.hasSecrets = 'false';
        return deployImage(context, node);
    }
}
