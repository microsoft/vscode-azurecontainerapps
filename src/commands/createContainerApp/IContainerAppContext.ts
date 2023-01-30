/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppModel } from "../../tree/ContainerAppItem";
import { IDeployImageContext } from '../deployImage/IDeployImageContext';
export interface IContainerAppContext extends IResourceGroupWizardContext, IDeployImageContext {
    managedEnvironmentId: string;
    newContainerAppName?: string;

    enableIngress?: boolean;
    enableExternal?: boolean;

    defaultPort?: number;
    targetPort?: number;

    // created when the wizard is done executing
    containerApp?: ContainerAppModel;
}

export type IContainerAppWithActivityContext = IContainerAppContext & ExecuteActivityContext;
