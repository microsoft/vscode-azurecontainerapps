/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from '@azure/arm-app';
import { Workspace } from '@azure/arm-operationalinsights';
import { ICreateChildImplContext, IResourceGroupWizardContext } from 'vscode-azureextensionui';

export interface IManagedEnvironmentContext extends IResourceGroupWizardContext, ICreateChildImplContext {

    newManagedEnvironmentName?: string;
    logAnalyticsWorkspace?: Workspace;

    // created when the wizard is done executing
    managedEnvironment?: ManagedEnvironment;
}
