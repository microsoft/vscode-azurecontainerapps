/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithMaskHandling, createSubscriptionContext, ISubscriptionActionContext, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { acrDomain, ImageSource } from "../../constants";
import { detectRegistryDomain, getRegistryFromAcrName } from "../../utils/imageNameUtils";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { deployImage } from "./deployImage";
import type { IContainerRegistryImageContext } from "./imageSource/containerRegistry/IContainerRegistryImageContext";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    image: string;
    registryName: string;
    username?: string;
    secret?: string;
}

export async function deployImageApi(context: ITreeItemPickerContext & Partial<IContainerRegistryImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    context.suppressCreatePick = true;
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
        return callWithMaskHandling<void>(() => deployImage(context, node), deployImageOptions.secret);
    } else {
        return deployImage(context, node);
    }
}
