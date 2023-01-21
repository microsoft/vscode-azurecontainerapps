/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from "@azure/arm-appcontainers";
import { Workspace } from '@azure/arm-operationalinsights';
import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { ExecuteActivityContext } from '@microsoft/vscode-azext-utils';

export interface IManagedEnvironmentContext extends IResourceGroupWizardContext, ExecuteActivityContext {
    newManagedEnvironmentName?: string;
    logAnalyticsWorkspace?: Workspace;

    // created when the wizard is done executing
    managedEnvironment?: ManagedEnvironment;
}
