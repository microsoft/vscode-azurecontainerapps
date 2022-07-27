/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeDataProvider, callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, IActionContext, registerUIExtensionVariables } from '@microsoft/vscode-azext-utils';
import { AzureExtensionApi, AzureExtensionApiProvider } from '@microsoft/vscode-azext-utils/api';
import { AzureHostExtensionApi } from '@microsoft/vscode-azext-utils/hostapi';
import * as vscode from 'vscode';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { registerCommands } from './commands/registerCommands';
import { ext } from './extensionVariables';
import { getApiExport } from './getExtensionApi';
import { AzureAccountTreeItem } from './tree/AzureAccountTreeItem';

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

        const accountTreeItem: AzureAccountTreeItem = new AzureAccountTreeItem();
        context.subscriptions.push(accountTreeItem);
        ext.tree = new AzExtTreeDataProvider(accountTreeItem, 'containerApps.loadMore');
        ext.treeView = vscode.window.createTreeView('containerApps', { treeDataProvider: ext.tree, showCollapseAll: true, canSelectMany: true });
        context.subscriptions.push(ext.treeView);


        registerCommands();
        ext.experimentationService = await createExperimentationService(context);

        const rgApiProvider = await getApiExport<AzureExtensionApiProvider>('ms-azuretools.vscode-azureresourcegroups');
        if (rgApiProvider) {
            const api = rgApiProvider.getApi<AzureHostExtensionApi>('0.0.1');
            ext.rgApi = api;
            // api.registerApplicationResourceResolver('Microsoft.Compute/virtualMachines', new VirtualMachineResolver());
        } else {
            throw new Error('Could not find the Azure Resource Groups extension');
        }
    });

    return createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivateInternal(): void {
}
