/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from '@azure/arm-appservice';
import { ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { ISubscriptionActionContext } from 'vscode-azureextensionui';

export interface IDeployImageContext extends ISubscriptionActionContext {
    targetContainer?: ContainerApp;

    registry?: ContainerRegistryManagementModels.Registry;
    repositoryName?: string;
    tag?: string
}
