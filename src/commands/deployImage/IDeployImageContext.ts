/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { SupportedRegistries } from '../../constants';
import { IDeployBaseContext } from "../deploy/IDeployBaseContext";

export interface IDeployImageContext extends IDeployBaseContext {
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
