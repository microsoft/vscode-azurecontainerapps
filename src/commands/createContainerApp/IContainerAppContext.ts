/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from '@azure/arm-app';
import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { IDeployImageContext } from '../deployImage/IDeployImageContext';

export interface IContainerAppContext extends IResourceGroupWizardContext, IDeployImageContext {
    managedEnvironmentId: string;
    newContainerAppName?: string;

    enableIngress?: boolean;
    enableExternal?: boolean;
    targetPort?: number;

    // created when the wizard is done executing
    containerApp?: ContainerApp;
}
