/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";

export interface IDeleteManagedEnvironmentWizardContext extends IActionContext, ExecuteActivityContext {
    suppressPrompt?: boolean;

    subscription: ISubscriptionContext;
    resourceGroupName: string;
    managedEnvironmentName: string;

    containerApps: ContainerAppTreeItem[];
}
