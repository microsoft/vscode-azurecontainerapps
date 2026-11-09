/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createApiProvider, maskUserInfo, type apiUtils, type IActionContext } from "@microsoft/vscode-azext-utils";
import { prepareAzureResourcesApiRequest, type AzureResourcesApiRequestContext, type AzureResourcesApiRequestError } from "@microsoft/vscode-azureresources-api";
import * as api from "../../commands/api/vscode-azurecontainerapps.api";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";

export function createContainerAppsApiProvider(registerBranchResources: AzureResourcesApiRequestContext["onDidReceiveAzureResourcesApis"], coreExtensionApi: api.AzureContainerAppsExtensionApi): apiUtils.AzureExtensionApiProvider {
    const context: AzureResourcesApiRequestContext = {
        azureResourcesApiVersions: ['^2.0.0'],
        clientExtensionId: ext.context.extension.id,
        onDidReceiveAzureResourcesApis: registerBranchResources,
        onApiRequestError: async (error: AzureResourcesApiRequestError) => {
            await callWithTelemetryAndErrorHandling('hostApiRequestFailed', (actionContext: IActionContext) => {
                actionContext.telemetry.properties.isActivationEvent = 'true';
                actionContext.telemetry.properties.hostApiRequestErrorCode = error.code;
                actionContext.telemetry.properties.hostApiRequestError = maskUserInfo(error.message, []);
                ext.outputChannel.appendLog(localize('apiRequestError', 'Error: Failed to connect extension to the Azure Resources host.'));
                ext.outputChannel.appendLog(`code: ${error.code}, message: ${error.message}`);
            });
        },
    };

    const { clientApi, requestResourcesApis } = prepareAzureResourcesApiRequest(context, coreExtensionApi);
    requestResourcesApis();
    return createApiProvider([clientApi]);
}
