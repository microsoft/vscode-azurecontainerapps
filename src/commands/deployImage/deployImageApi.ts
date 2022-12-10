/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionContext } from "@microsoft/vscode-azext-dev";
import { IActionContext, ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomain, dockerHubDomain, RegistryTypes } from "../../constants";
import { ext } from "../../extensionVariables";
import { imageNameUtils } from "../../utils/parseImageNameUtils";
import { deployImage } from "./deployImage";
import { IDeployImageContext } from "./IDeployImageContext";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    imageName: string;
    loginServer?: string;
    username?: string;
    secret?: string;
}

export async function deployImageApi(context: IActionContext & Partial<IDeployImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    const subscription: ISubscriptionContext = (await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context)).subscription;
    Object.assign(context, subscription);

    const registryType: RegistryTypes = imageNameUtils.detectRegistryType(deployImageOptions.imageName, deployImageOptions.loginServer);

    switch (registryType) {
        case RegistryTypes.ACR:
            context.registryDomain = acrDomain;
            Object.assign(context, await imageNameUtils.parseFromAcrName(<ISubscriptionActionContext>context, deployImageOptions.imageName));
            break;
        case RegistryTypes.DH:
            context.registryDomain = dockerHubDomain;
            Object.assign(context, imageNameUtils.parseFromDockerHubName(deployImageOptions.imageName));
            break;
        case RegistryTypes.Custom:
            break;
        default:
    }

    return deployImage(context, undefined);
}
