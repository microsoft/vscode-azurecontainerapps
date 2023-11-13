/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { type ContainerAppModel } from "../tree/ContainerAppItem";

// Todo: Investigate consolidating 'ISubscriptionActionContext' and 'AzureSubscription'
export interface IContainerAppContext extends ISubscriptionActionContext {
    subscription: AzureSubscription;
    containerApp?: ContainerAppModel;
}
