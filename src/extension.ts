/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { registerGitHubExtensionVariables } from '@microsoft/vscode-azext-github';
import { TreeElementStateManager, callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, createExperimentationService, registerUIExtensionVariables, type IActionContext, type apiUtils } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResourcesExtensionApi } from '@microsoft/vscode-azureresources-api';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { createContainerAppsApiProvider } from './commands/api/createContainerAppsApiProvider';
import { openLocalPlanView, refreshLocalPlanView } from './commands/copilot/openLocalPlanView';
import { openPlanView, refreshPlanView } from './commands/copilot/openPlanView';
import { registerCommands } from './commands/registerCommands';
import { RevisionDraftFileSystem } from './commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from './extensionVariables';
import { ContainerAppsBranchDataProvider } from './tree/ContainerAppsBranchDataProvider';
import { localize } from './utils/localize';
import { parsePlanMarkdown } from './utils/parsePlanMarkdown';

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

        // Watch for project-plan.md changes to detect plan creation and scaffold completion
        const planWatcher = vscode.workspace.createFileSystemWatcher('**/project-plan.md');
        let planViewDebounceTimer: ReturnType<typeof setTimeout> | undefined;
        const debouncePlanViewOpen = (uri: vscode.Uri) => {
            if (planViewDebounceTimer) { clearTimeout(planViewDebounceTimer); }
            planViewDebounceTimer = setTimeout(() => {
                planViewDebounceTimer = undefined;
                openPlanView(uri);
            }, 2000);
        };
        planWatcher.onDidCreate((uri) => debouncePlanViewOpen(uri));
        planWatcher.onDidChange((uri) => {
            if (planViewDebounceTimer) {
                // Still waiting for initial content to settle
                debouncePlanViewOpen(uri);
            } else {
                // Refresh view content if it's already open
                refreshPlanView(uri);
                void handlePlanChanged(uri, planWatcher);
            }
        });
        context.subscriptions.push(planWatcher);

        // Watch for local-dev.plan.md creation to open the local plan view
        const localPlanWatcher = vscode.workspace.createFileSystemWatcher('**/local-dev.plan.md');
        let localPlanViewDebounceTimer: ReturnType<typeof setTimeout> | undefined;
        const debounceLocalPlanViewOpen = (uri: vscode.Uri) => {
            if (localPlanViewDebounceTimer) { clearTimeout(localPlanViewDebounceTimer); }
            localPlanViewDebounceTimer = setTimeout(() => {
                localPlanViewDebounceTimer = undefined;
                openLocalPlanView(uri);
            }, 2000);
        };
        localPlanWatcher.onDidCreate((uri) => debounceLocalPlanViewOpen(uri));
        localPlanWatcher.onDidChange((uri) => {
            if (localPlanViewDebounceTimer) {
                debounceLocalPlanViewOpen(uri);
            } else {
                refreshLocalPlanView(uri);
            }
        });
        context.subscriptions.push(localPlanWatcher);

        // Fallback: detect plan files via workspace file creation events
        // (fires when files are created via VS Code API, e.g. WorkspaceEdit / Copilot tools)
        context.subscriptions.push(
            vscode.workspace.onDidCreateFiles((e) => {
                for (const file of e.files) {
                    const filename = file.path.split('/').pop();
                    if (filename === 'project-plan.md') {
                        debouncePlanViewOpen(file);
                    } else if (filename === 'local-dev.plan.md') {
                        debounceLocalPlanViewOpen(file);
                    }
                }
            }),
        );

        // Register MCP server for scaffold-complete UI in chat
        context.subscriptions.push(
            vscode.lm.registerMcpServerDefinitionProvider('containerAppsMcp', {
                provideMcpServerDefinitions: () => [
                    new vscode.McpStdioServerDefinition(
                        'Azure Container Apps Assistant',
                        'node',
                        [path.join(context.extensionPath, 'dist', 'scaffoldCompleteServer.js')],
                    ),
                ],
                resolveMcpServerDefinition: (server) => server,
            }),
        );

        const authHandshakeId = uuid();
        const authHandshakeStartMs = Date.now();
        activateContext.telemetry.properties.authHandshakeId = authHandshakeId;

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
            });
        };

        return createContainerAppsApiProvider(registerBranchResources);

    }) ?? createApiProvider([]);
}

async function handlePlanChanged(uri: vscode.Uri, watcher: vscode.FileSystemWatcher): Promise<void> {
    const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
    const planData = parsePlanMarkdown(content);
    if (planData.status.toLowerCase() === 'scaffolded') {
        void vscode.commands.executeCommand('azureProjectCreation.completeStep', 'projectCreation/plan/scaffold');
        void vscode.commands.executeCommand('azureProjectCreation.focus', ['projectCreation/localDevelopment']);

        // Stop watching once scaffold is complete
        watcher.dispose();
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
}
