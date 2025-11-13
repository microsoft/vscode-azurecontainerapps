/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createApiProvider, maskUserInfo, type apiUtils, type IActionContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, prepareAzureResourcesApiRequest, type AzureResourcesApiRequestContext, type AzureResourcesApiRequestError, type AzureResourcesExtensionApi } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { deployImageApi } from "./deployImageApi";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function createContainerAppsApiProvider(): apiUtils.AzureExtensionApiProvider {
    const v2: string = '^2.0.0';

    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: [v2],
        clientExtensionId: ext.context.extension.id,

        onDidReceiveAzureResourcesApis: async (azureResourcesApis: (AzureResourcesExtensionApi | undefined)[]) => {
            await callWithTelemetryAndErrorHandling('hostApiRequestSucceeded', (actionContext: IActionContext) => {
                actionContext.errorHandling.rethrow = true;

                const [rgApiV2] = azureResourcesApis;
                if (!rgApiV2) {
                    throw new Error(localize('noMatchingApi', 'Failed to find a matching Azure Resources API for version "{0}".', v2));
                }

                ext.rgApiV2 = rgApiV2;
                ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
            });
        },

        onApiRequestError: async (error: AzureResourcesApiRequestError) => {
            await callWithTelemetryAndErrorHandling('hostApiRequestFailed', (actionContext: IActionContext) => {
                actionContext.telemetry.properties.hostApiRequestErrorCode = error.code;
                actionContext.telemetry.properties.hostApiRequestError = maskUserInfo(error.message, []);
                ext.outputChannel.appendLog(localize('apiRequestError', 'Error: Failed to connect extension to the Azure Resources host.'));
                ext.outputChannel.appendLog(JSON.stringify(error));
            });
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
