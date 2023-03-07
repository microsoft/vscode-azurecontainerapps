/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ImageSourceValues } from '../../constants';
import { ContainerAppModel } from "../../tree/ContainerAppItem";
import { IDeployFromRegistryContext } from '../deploy/deployFromRegistry/IDeployFromRegistryContext';
export interface IContainerAppContext extends IResourceGroupWizardContext, IDeployFromRegistryContext {
    managedEnvironmentId: string;
    newContainerAppName?: string;
    imageSource?: ImageSourceValues;

    enableIngress?: boolean;
    enableExternal?: boolean;

    defaultPort?: number;
    targetPort?: number;

    // created when the wizard is done executing
    containerApp?: ContainerAppModel;
}

export type IContainerAppWithActivityContext = IContainerAppContext & ExecuteActivityContext;
