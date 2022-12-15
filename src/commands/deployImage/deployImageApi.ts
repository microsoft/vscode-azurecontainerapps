/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionContext } from "@microsoft/vscode-azext-dev";
import { IActionContext, ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../constants";
import { ext } from "../../extensionVariables";
import { imageNameUtils } from "../../utils/parseImageNameUtils";
import { deployImage } from "./deployImage";
import { IDeployImageContext } from "./IDeployImageContext";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    imageName: string;  // Todo: change `imageName` to `image` or vice versa
    loginServer?: string;  // Todo: verify formatting with Brandon, esp for docker hub
    username?: string;
    secret?: string;
}

export async function deployImageApi(context: IActionContext & Partial<IDeployImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    const subscription: ISubscriptionContext = (await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context)).subscription;
    Object.assign(context, subscription);

    // test case for docker hub, will remove later
    deployImageOptions.imageName = 'docker.io/' + deployImageOptions.imageName;
    deployImageOptions.loginServer = 'index.docker.io';

    context.registryDomain = imageNameUtils.detectRegistryDomain(deployImageOptions.imageName);
    if (context.registryDomain === acrDomain) {
        context.registry = await imageNameUtils.getRegistryFromAcrName(<ISubscriptionActionContext>context, deployImageOptions.imageName);
    }

    // Todo: change contract from imageName to image (or vice versa) and just run `Object.assign(context, deployImageOptions)`
    Object.assign(context, {
        image: deployImageOptions.imageName,
        loginServer: deployImageOptions.loginServer,
        username: deployImageOptions.username,
        secret: deployImageOptions.secret
    });


    // Todo: Check how to handle username and secret masking
    if (context.secret) {
        context.valuesToMask.push(context.secret);
    }
    context.valuesToMask.push(<string>context.image);

    return deployImage(context, undefined);
}
