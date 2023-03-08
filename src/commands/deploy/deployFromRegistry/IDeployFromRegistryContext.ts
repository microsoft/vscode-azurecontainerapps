/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { SupportedRegistries } from '../../../constants';
import { IDeployBaseContext } from "../IDeployBaseContext";

export interface IDeployFromRegistryContext extends IDeployBaseContext {
    registryDomain?: SupportedRegistries;
    registry?: ContainerRegistryManagementModels.Registry;
    dockerHubNamespace?: string;

    repositoryName?: string;
    tag?: string;

    // Registry credentials
    registryName?: string;
    username?: string;
    secret?: string;
}
