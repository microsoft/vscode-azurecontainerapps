/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Workspace } from '@azure/arm-operationalinsights';
import { type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { type ExecuteActivityContext } from '@microsoft/vscode-azext-utils';
import { type IContainerAppContext } from "../IContainerAppContext";

export interface IManagedEnvironmentContext extends IContainerAppContext, IResourceGroupWizardContext, ExecuteActivityContext {
    newManagedEnvironmentName?: string;
    logAnalyticsWorkspace?: Workspace;

    managedEnvironment?: ManagedEnvironment;
}
