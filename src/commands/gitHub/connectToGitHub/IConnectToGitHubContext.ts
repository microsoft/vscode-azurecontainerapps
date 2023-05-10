/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Registry } from '@azure/arm-containerregistry';
import type { ExecuteActivityContext, ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import type { IGitHubContext } from '../../../gitHub/IGitHubContext';
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";

export interface IConnectToGitHubContext extends ISubscriptionActionContext, IGitHubContext, ExecuteActivityContext {
    targetContainer: ContainerAppModel;
    subscription: AzureSubscription;

    // Dockerfile
    dockerfilePath?: string;

    // Azure Container Registry
    registry?: Registry;
    repositoryName?: string;

    // Service Principal
    servicePrincipalId?: string;
    servicePrincipalSecret?: string;
}
