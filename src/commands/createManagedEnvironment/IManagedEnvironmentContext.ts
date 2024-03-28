/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Workspace } from '@azure/arm-operationalinsights';
import { type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { type ExecuteActivityContext, type ISubscriptionActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";

export interface IManagedEnvironmentContext extends ISubscriptionActionContext, IResourceGroupWizardContext, ExecuteActivityContext {
    subscription: AzureSubscription;

    newManagedEnvironmentName?: string;
    newLogAnalyticsWorkspaceName?: string;
    logAnalyticsWorkspace?: Workspace;

    // created when the wizard is done executing
    managedEnvironment?: ManagedEnvironment;
}
