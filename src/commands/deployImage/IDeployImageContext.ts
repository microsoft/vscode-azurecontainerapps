/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerApp, EnvironmentVar } from "@azure/arm-appcontainers";
import type { ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { ISubscriptionActionContext } from '@microsoft/vscode-azext-utils';
import { SupportedRegistries } from '../../constants';

export interface IDeployImageContext extends ISubscriptionActionContext {
    targetContainer?: ContainerApp;
    registryDomain?: SupportedRegistries;

    registry?: ContainerRegistryManagementModels.Registry;
    dockerHubNamespace?: string;

    repositoryName?: string;
    tag?: string;

    // Fully qualified image name that will be generated by "registry login server:tag" if left undefined
    image?: string;
    environmentVariables?: EnvironmentVar[];

    // Registry credentials
    registryName?: string;
    username?: string;
    secret?: string;
}
