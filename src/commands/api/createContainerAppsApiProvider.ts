/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, maskUserInfo, type apiUtils, type IActionContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, prepareAzureResourcesApiRequest, type AzureResourcesApiRequestContext, type AzureResourcesApiRequestError, type AzureResourcesExtensionApi } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function createContainerAppsApiProvider(activationContext: IActionContext): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: ['2.0.0'],
        clientExtensionId: ext.context.extension.id,
        onDidReceiveAzureResourcesApis: (azureResourcesApis: (AzureResourcesExtensionApi | undefined)[]) => {
            const [rgApiV2] = azureResourcesApis;
            if (!rgApiV2) {
                throw new Error(localize('failedHostIntegration', 'Failed to integrate with the Azure Resources host.'));
            }
            ext.rgApiV2 = rgApiV2;
            ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
        },
        onApiRequestError: (error: AzureResourcesApiRequestError) => {
            activationContext.telemetry.properties.handshakeError = maskUserInfo(error.message, []);
            activationContext.telemetry.properties.handshakeErrorCode = error.code;
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
