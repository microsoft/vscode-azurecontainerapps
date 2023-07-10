/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Registry } from '@azure/arm-containerregistry';
import type { GitHubContext } from '@microsoft/vscode-azext-github';
import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { IContainerAppContext } from '../../IContainerAppContext';

export interface IConnectToGitHubContext extends IContainerAppContext, GitHubContext, ExecuteActivityContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;

    // Dockerfile
    dockerfilePath?: string;

    // Azure Container Registry
    registry?: Registry;
    repositoryName?: string;

    // Service Principal
    servicePrincipalId?: string;
    servicePrincipalSecret?: string;
}
