/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ContainerAppModel } from "../tree/ContainerAppItem";

// Todo: Investigate consolidating 'ISubscriptionActionContext' and 'AzureSubscription'
export interface IContainerAppContext extends ISubscriptionActionContext {
    subscription: AzureSubscription;
    containerApp?: ContainerAppModel;
}
