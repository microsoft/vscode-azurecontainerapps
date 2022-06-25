/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp } from "@azure/arm-appcontainers";
import { ExecuteActivityContext, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ManagedEnvironmentResource } from "../resolver/ManagedEnvironmentResource";

export interface IDeleteWizardContext extends IActionContext, ExecuteActivityContext {
    node: ManagedEnvironmentResource | ContainerAppResource;
    subscription: ISubscriptionContext;

    containerApps?: ContainerApp[];
}
