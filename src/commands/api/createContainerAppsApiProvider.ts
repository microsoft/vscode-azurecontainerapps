/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, type apiUtils } from "@microsoft/vscode-azext-utils";
import { prepareAzureResourcesApiRequest, type AzureResourcesApiRequestContext } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function createContainerAppsApiProvider(registerBranchResources: AzureResourcesApiRequestContext["onDidReceiveAzureResourcesApis"], onFailedRegistration: AzureResourcesApiRequestContext["onApiRequestError"]): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: ['^2.0.0'],
        clientExtensionId: ext.context.extension.id,
        onDidReceiveAzureResourcesApis: registerBranchResources,
        onApiRequestError: onFailedRegistration,
    };

    const containerAppsApi: api.AzureContainerAppsExtensionApi = {
        apiVersion: '1.0.0',
        deployImage: deployImageApi,
        deployWorkspaceProject: deployWorkspaceProjectApi,
    };

    const { clientApi, requestResourcesApis } = prepareAzureResourcesApiRequest(context, containerAppsApi);
    requestResourcesApis();
    return createApiProvider([clientApi]);
}
