/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, type apiUtils } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, AzureResourcesHandshakeErrors, prepareAzureResourcesApiRequest, type AzExtCredentialManager, type AzureResourcesApiRequestContext, type AzureResourcesExtensionApi, type AzureResourcesHandshakeError } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function exportAzureContainerAppsApiProvider(credentialManager: AzExtCredentialManager<unknown>): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: ['2.0.0'],
        clientExtensionId: ext.context.extension.id,
        clientCredentialManager: credentialManager,
        onDidReceiveAzureResourcesApis: (azureResourcesApis: (AzureResourcesExtensionApi | undefined)[]) => {
            const [rgApiV2] = azureResourcesApis;
            if (!rgApiV2) {
                throw new Error();
            }
            ext.rgApiV2 = rgApiV2;
            ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
        },
        onHandshakeError: (error: AzureResourcesHandshakeError) => {
            switch (true) {
                case error.code === AzureResourcesHandshakeErrors.CLIENT_EXT_NOT_READY.code:
                case error.code === AzureResourcesHandshakeErrors.HOST_EXT_NOT_READY.code:
                case error.code === AzureResourcesHandshakeErrors.INSUFFICIENT_CREDENTIALS.code:
                case error.code === AzureResourcesHandshakeErrors.FAILED_VERIFICATION.code:
                case error.code === AzureResourcesHandshakeErrors.FAILED_GET_API.code:
                case error.code === AzureResourcesHandshakeErrors.UNEXPECTED.code:
                default:
            }
        },
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
