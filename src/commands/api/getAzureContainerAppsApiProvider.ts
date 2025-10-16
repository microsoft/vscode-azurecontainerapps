/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, type apiUtils } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, AzExtSignatureCredentialManager, prepareAzureResourcesHandshake, type AzExtCredentialManager, type AzureResourcesExtensionApi, type AzureResourcesHandshakeContext } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

const azureContainerAppsCredentialManager: AzExtCredentialManager<string> = new AzExtSignatureCredentialManager();

export function getAzureContainerAppsApiProvider(): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesHandshakeContext = {
        azureResourcesApiVersion: '3.0.0',
        clientExtensionId: ext.context.extension.id,
        clientCredentialManager: azureContainerAppsCredentialManager,
        onDidReceiveAzureResourcesApi: (azureResourcesApi: AzureResourcesExtensionApi) => {
            ext.rgApiV2 = azureResourcesApi;
            ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
        },
    };

    const containerAppsApi: api.AzureContainerAppsExtensionApi = {
        apiVersion: '1.0.0',
        deployImage: deployImageApi,
        deployWorkspaceProject: deployWorkspaceProjectApi,
    };

    const { api, initiateHandshake } = prepareAzureResourcesHandshake(context, containerAppsApi);
    void initiateHandshake();
    return createApiProvider([api]);
}
