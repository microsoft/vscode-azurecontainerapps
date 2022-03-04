/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from '@azure/arm-app';
import { ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { ISubscriptionActionContext } from 'vscode-azureextensionui';
import { SupportedRegistries } from '../../constants';

export interface IDeployImageContext extends ISubscriptionActionContext {
    targetContainer?: ContainerApp;
    registryDomain?: SupportedRegistries;

    registry?: ContainerRegistryManagementModels.Registry
    dockerHubNamespace?: string;

    repositoryName?: string;
    tag?: string
}
