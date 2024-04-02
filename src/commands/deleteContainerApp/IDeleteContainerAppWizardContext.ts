/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";

export interface IDeleteContainerAppWizardContext extends IActionContext, ExecuteActivityContext {
    subscription: ISubscriptionContext;
    resourceGroupName: string;
    containerAppNames: string | string[];
}
