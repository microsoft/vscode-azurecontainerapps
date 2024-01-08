/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createApiProvider, type IActionContext, type apiUtils } from "@microsoft/vscode-azext-utils";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

// Add links to changelog and type interface
export function getAzureContainerAppsApiProvider(): apiUtils.AzureExtensionApiProvider {
    return createApiProvider([<api.AzureContainerAppsExtensionApi>{
        apiVersion: '0.0.1',

        deployWorkspaceProject: async (options: api.DeployWorkspaceProjectOptionsContract) => await callWithTelemetryAndErrorHandling('containerApps.api.deployWorkspaceProject', async (context: IActionContext) => {
            return await deployWorkspaceProjectApi(context, options);
        })
    }]);
}
