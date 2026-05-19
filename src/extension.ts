/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { registerGitHubExtensionVariables } from '@microsoft/vscode-azext-github';
import { TreeElementStateManager, callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, registerUIExtensionVariables, type IActionContext, type apiUtils } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResourcesExtensionApi } from '@microsoft/vscode-azureresources-api';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import * as api from "../src/commands/api/vscode-azurecontainerapps.api";
import { createContainerAppsApiProvider } from './commands/api/createContainerAppsApiProvider';
import { deployImageApi } from './commands/api/deployImageApi';
import { deployWorkspaceProjectApi, deployWorkspaceProjectApiInternal } from './commands/api/deployWorkspaceProjectApi';
import { createContainerApp } from './commands/createContainerApp/createContainerApp';
import { createManagedEnvironment } from './commands/createManagedEnvironment/createManagedEnvironment';
import { deployContainerApp } from './commands/deployContainerApp/deployContainerApp';
import { deployWorkspaceProject } from './commands/deployWorkspaceProject/deployWorkspaceProject';
import { registerCommands } from './commands/registerCommands';
import { RevisionDraftFileSystem } from './commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from './extensionVariables';
import { AzureContainerAppsTestApi } from './testApi';
import { ContainerAppsResourceBranchDataProvider } from './tree/ContainerAppResourceItem';
import { ContainerAppsBranchDataProvider } from './tree/ContainerAppsBranchDataProvider';
import { localize } from './utils/localize';

export async function activate(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<apiUtils.AzureExtensionApiProvider> {
    // the entry point for vscode.dev is this activate, not main.js, so we need to instantiate perfStats here
    // the perf stats don't matter for vscode because there is no main file to load-- we may need to see if we can track the download time
    perfStats ||= { loadStartTime: Date.now(), loadEndTime: Date.now() };
    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Container Apps', ext.prefix);
    context.subscriptions.push(ext.outputChannel);

    registerUIExtensionVariables(ext);
    registerAzureUtilsExtensionVariables(ext);
    registerGitHubExtensionVariables(ext);

    return await callWithTelemetryAndErrorHandling('containerApps.activate', async (activateContext: IActionContext) => {
        activateContext.errorHandling.rethrow = true;
        activateContext.telemetry.properties.isActivationEvent = 'true';
        activateContext.telemetry.measurements.mainFileLoad = (perfStats.loadEndTime - perfStats.loadStartTime) / 1000;

        registerCommands();
        ext.experimentationService = await createExperimentationService(context);

        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
        context.subscriptions.push(vscode.workspace.registerFileSystemProvider(RevisionDraftFileSystem.scheme, ext.revisionDraftFileSystem));

        ext.state = new TreeElementStateManager();
        ext.branchDataProvider = new ContainerAppsBranchDataProvider();
        ext.containerAppsResourceBranchDataProvider = new ContainerAppsResourceBranchDataProvider();

        const authHandshakeId = uuid();
        const authHandshakeStartMs = Date.now();
        activateContext.telemetry.properties.authHandshakeId = authHandshakeId;

        // Deferred promise: extracts `resolve` so `registerBranchResources` can signal completion to awaiting callers
        let resolveHandshake: () => void;
        const handshakePromise = new Promise<void>((resolve) => { resolveHandshake = resolve; });

        const registerBranchResources = async (azureResourcesApis: (AzureResourcesExtensionApi | undefined)[]) => {
            await callWithTelemetryAndErrorHandling('hostApiRequestSucceeded', (actionContext: IActionContext) => {
                actionContext.telemetry.measurements.authHandshakeDuration = (Date.now() - authHandshakeStartMs) / 1000;
                actionContext.telemetry.properties.authHandshakeId = authHandshakeId;
                actionContext.telemetry.properties.isActivationEvent = 'true';
                actionContext.errorHandling.rethrow = true;

                const [rgApiV2] = azureResourcesApis;
                if (!rgApiV2 || !rgApiV2.apiVersion.match(/^2\./)) {
                    throw new Error(localize('noMatchingApi', 'Failed to find a matching Azure Resources API for version "{0}".', '^2.0.0'));
                }

                ext.rgApiV2 = rgApiV2;
                ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
                ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerApps, ext.containerAppsResourceBranchDataProvider);
            });
            resolveHandshake();
        };

        const coreApiEndpoints = {
            deployImage: deployImageApi,
            deployWorkspaceProject: deployWorkspaceProjectApi,
        };

        let coreExtensionApi: api.AzureContainerAppsExtensionApi | AzureContainerAppsTestApi;
        if (process.env.VSCODE_RUNNING_TESTS) {
            // Provide test API when running tests
            // This allows tests to access internal extension state
            coreExtensionApi = {
                apiVersion: '99.0.0',
                ...coreApiEndpoints,
                extensionVariables: {
                    getOutputChannel: async () => { await handshakePromise; return ext.outputChannel; },
                    getRgApiV2: async () => { await handshakePromise; return ext.rgApiV2; },
                    getState: async () => { await handshakePromise; return ext.state; },
                    getBranchDataProvider: async () => { await handshakePromise; return ext.branchDataProvider; },
                },
                // Export internal methods with the testApi so that we can test them directly
                createContainerAppInternal: createContainerApp,
                createManagedEnvironmentInternal: createManagedEnvironment,
                deployContainerAppInternal: deployContainerApp,
                deployWorkspaceProjectInternal: deployWorkspaceProject,
                deployWorkspaceProjectApiInternal: deployWorkspaceProjectApiInternal,
            } satisfies AzureContainerAppsTestApi;
        } else {
            coreExtensionApi = {
                apiVersion: '1.1.0',
                ...coreApiEndpoints,
            };
        }

        return createContainerAppsApiProvider(registerBranchResources, coreExtensionApi);

    }) ?? createApiProvider([]);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
}
