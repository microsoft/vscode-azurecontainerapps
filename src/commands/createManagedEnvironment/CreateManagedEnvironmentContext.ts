/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Workspace } from '@azure/arm-operationalinsights';
import { type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { type ExecuteActivityContext, type ISubscriptionActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";

export interface CreateManagedEnvironmentContext extends ISubscriptionActionContext, IResourceGroupWizardContext, ExecuteActivityContext {
    subscription: AzureSubscription;

    newManagedEnvironmentName?: string;
    newLogAnalyticsWorkspaceName?: string;  // This isn't normally populated by a name step, but we still allow this to be prepopulated

    // created when the wizard is done executing
    logAnalyticsWorkspace?: Workspace;
    managedEnvironment?: ManagedEnvironment;
}
