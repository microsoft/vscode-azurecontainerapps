/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, IActionContext, registerUIExtensionVariables } from '@microsoft/vscode-azext-utils';
import { AzureExtensionApi, AzureExtensionApiProvider } from '@microsoft/vscode-azext-utils/api';
import * as vscode from 'vscode';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { registerCommands } from './commands/registerCommands';
import { extensionId } from './constants';
import { ext } from './extensionVariables';
import { getResourceGroupsApi } from './getExtensionApi';
import { ContainerAppsExtResolver } from './resolver/ContainerAppsExtResolver';
import { ContainerAppsBranchDataProvider } from './tree/ContainerAppsBranchDataProvider';

export async function activateInternal(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<AzureExtensionApiProvider> {
    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Container Apps', ext.prefix);
    context.subscriptions.push(ext.outputChannel);

    registerUIExtensionVariables(ext);
    registerAzureUtilsExtensionVariables(ext);

    await callWithTelemetryAndErrorHandling('containerApps.activate', async (activateContext: IActionContext) => {
        activateContext.telemetry.properties.isActivationEvent = 'true';
        activateContext.telemetry.measurements.mainFileLoad = (perfStats.loadEndTime - perfStats.loadStartTime) / 1000;

        registerCommands();
        ext.branch = new ContainerAppsBranchDataProvider();
        ext.experimentationService = await createExperimentationService(context);
        ext.rgApi = await getResourceGroupsApi();
        ext.rgApi.registerApplicationResourceResolver(extensionId, new ContainerAppsExtResolver());
    });

    return createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivateInternal(): void {
}
