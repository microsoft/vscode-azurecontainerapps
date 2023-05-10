/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { IGitHubContext } from "../../gitHub/IGitHubContext";
import { ContainerAppModel } from "../../tree/ContainerAppItem";

export interface IDisconnectRepoContext extends ISubscriptionActionContext, IGitHubContext, ExecuteActivityContext {
    targetContainer: ContainerAppModel;
    subscription: AzureSubscription;
}
