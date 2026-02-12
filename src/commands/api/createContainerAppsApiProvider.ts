/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createApiProvider, maskUserInfo, type apiUtils, type IActionContext } from "@microsoft/vscode-azext-utils";
import { prepareAzureResourcesApiRequest, type AzureResourcesApiRequestContext, type AzureResourcesApiRequestError } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function createContainerAppsApiProvider(registerBranchResources: AzureResourcesApiRequestContext["onDidReceiveAzureResourcesApis"]): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: ['^2.0.0'],
        clientExtensionId: ext.context.extension.id,
        onDidReceiveAzureResourcesApis: registerBranchResources,
        onApiRequestError: async (error: AzureResourcesApiRequestError) => {
            await callWithTelemetryAndErrorHandling('hostApiRequestFailed', (actionContext: IActionContext) => {
                actionContext.telemetry.properties.hostApiRequestErrorCode = error.code;
                actionContext.telemetry.properties.hostApiRequestError = maskUserInfo(error.message, []);
                ext.outputChannel.appendLog(localize('apiRequestError', 'Error: Failed to connect extension to the Azure Resources host.'));
                ext.outputChannel.appendLog(`code: ${error.code}, message: ${error.message}`);
            });
        },
    };

    const containerAppsApi: api.AzureContainerAppsExtensionApi = {
        apiVersion: '1.1.0',
        deployImage: deployImageApi,
        deployWorkspaceProject: deployWorkspaceProjectApi,
    };

    const { clientApi, requestResourcesApis } = prepareAzureResourcesApiRequest(context, containerAppsApi);
    requestResourcesApis();
    return createApiProvider([clientApi]);
}
