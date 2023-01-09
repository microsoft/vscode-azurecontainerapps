/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionContext } from "@microsoft/vscode-azext-dev";
import { callWithMaskHandling, IActionContext, ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../constants";
import { ext } from "../../extensionVariables";
import { imageNameUtils } from "../../utils/imageNameUtils";
import { deployImage } from "./deployImage";
import { IDeployImageContext } from "./IDeployImageContext";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    image: string;
    loginServer?: string;
    username?: string;
    secret?: string;
}

export async function deployImageApi(context: IActionContext & Partial<IDeployImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    const subscription: ISubscriptionContext = (await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context)).subscription;
    Object.assign(context, subscription, deployImageOptions);

    context.registryDomain = imageNameUtils.detectRegistryDomain(deployImageOptions.image);
    if (context.registryDomain === acrDomain) {
        context.registry = await imageNameUtils.getRegistryFromAcrName(<ISubscriptionActionContext>context, deployImageOptions.image);
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
        return callWithMaskHandling<void>(() => deployImage(context, undefined), deployImageOptions.secret);
    } else {
        return deployImage(context, undefined);
    }
}
