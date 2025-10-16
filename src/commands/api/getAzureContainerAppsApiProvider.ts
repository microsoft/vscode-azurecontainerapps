/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, type apiUtils } from "@microsoft/vscode-azext-utils";
import { receiveAzureResourcesSession } from "./azureResourcesSession";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export const azureContainerAppsApiVersion = '1.0.0';

export function getAzureContainerAppsApiProvider(): apiUtils.AzureExtensionApiProvider {
    return createApiProvider([<api.AzureContainerAppsExtensionApi>{
        apiVersion: azureContainerAppsApiVersion,
        deployImage: deployImageApi,
        deployWorkspaceProject: deployWorkspaceProjectApi,
        receiveAzureResourcesSession,
    }]);
}
