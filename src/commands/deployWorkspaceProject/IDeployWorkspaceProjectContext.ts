
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";

export enum DeploymentMode {
    Basic = 'basic',
    Advanced = 'advanced'
}

export type IDeployWorkspaceProjectContext = IDeployWorkspaceProjectBaseContext & IManagedEnvironmentContext & ICreateContainerAppContext & Partial<IBuildImageInAzureContext>;

export interface IDeployWorkspaceProjectBaseContext {
    deploymentMode?: DeploymentMode;
}
