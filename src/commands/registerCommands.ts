/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

<<<<<<< HEAD
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { commands } from 'vscode';
import { AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand, sendRequestWithTimeout } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { createWebSiteClient } from '../utils/azureClients';
import { browse } from './browse';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { deleteNode } from './deleteNode';
import { deployImage } from './deployImage/deployImage';
import { editTargetPort, toggleIngress, toggleIngressVisibility } from './ingressCommands';
import { openInPortal } from './openInPortal';
import { openLogs } from './openLogs';
import { viewProperties } from './viewProperties';
=======
import { commands } from 'vscode';
import { AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { SubscriptionTreeItem } from '../tree/SubscriptionTreeItem';
import { browse } from './browse';
import { openInPortal } from './openInPortal';
>>>>>>> 14c2b852407862c4c077329e9704ea1250b0e8cc

export function registerCommands(): void {

    registerCommand('containerApps.loadMore', async (context: IActionContext, node: AzExtTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('containerApps.openInPortal', openInPortal);
    registerCommand('containerApps.refresh', async (context: IActionContext, node?: AzExtTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('containerApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('containerApps.viewProperties', viewProperties);
    registerCommand('containerApps.browse', browse);
    registerCommand('containerApps.createContainerApp', createContainerApp);
    registerCommand('containerApps.deployImage', deployImage);
    registerCommand('containerApps.deleteContainerApp', async (context: IActionContext, node?: ContainerAppTreeItem) => await deleteNode(context, ContainerAppTreeItem.contextValue, node));
    registerCommand('containerApps.openLogs', openLogs);
    registerCommand('containerApps.enableIngress', toggleIngress);
    registerCommand('containerApps.disableIngress', toggleIngress);
    registerCommand('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommand('containerApps.editTargetPort', editTargetPort);

    // TODO: Remove, this is just for testing
    registerCommand('containerApps.testCommand', async (context: IActionContext, node?: ContainerAppTreeItem) => {
        const url = 'https://hub.docker.com/v2/repositories/velikriss';
        const dockerhub = await sendRequestWithTimeout(context, { url, method: 'GET' }, 5000, undefined)
        console.log(dockerhub);

        if (!node) {
            node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem>(ContainerAppTreeItem.contextValue, context);
        }

        const containerEnv = await node.getContainerEnvelopeWithSecrets(context);

        containerEnv.template ||= {};
        containerEnv.template.dapr = {
            "enabled": true,
            "appId": "nodeapp",
            "appPort": 3000,
            "components": [
                {
                    "name": "statestore",
                    "type": "state.azure.blobstorage",
                    "version": "v1",
                    "metadata": [
                        {
                            "name": "accountName",
                            "value": "naturinsdapr",
                            "secretRef": ""
                        },
                        {
                            "name": "accountKey",
                            "value": "zOvri+bDG4HHDpng621F/5kq/tzYBNiat5f91TRfIScqqXaU+AXX/jE4YAj4LIXUQZsvbpLJXy6V8cEq7uUMkg==",
                            "secretRef": ""
                        },
                        {
                            "name": "containerName",
                            "value": "nodeapp",
                            "secretRef": ""
                        }
                    ]
                }
            ]
        };

        const webClient: WebSiteManagementClient = await createWebSiteClient([context, node]);
        await webClient.containerApps.beginCreateOrUpdateAndWait(node.resourceGroupName, node.name, containerEnv);

        // await webClient.containerApps.beginCreateOrUpdateAndWait(node.resourceGroupName, 'dockercontainer3', {
        //     location: node.data.location,
        //     kubeEnvironmentId: node.id,
        //     configuration: {
        //         ingress: {
        //             targetPort: 80,
        //             external: true,
        //             transport: 'auto',
        //             allowInsecure: false,
        //             traffic: [
        //                 {
        //                     "weight": 100,
        //                     "latestRevision": true
        //                 }
        //             ],
        //         }
        //     },
        //     template: {
        //         containers: [
        //             { image: 'docker.io/velikriss/gettingstarted:latest', name: 'velikriss-gettingstarted-latest' }
        //         ]
        //     }
        // });
    });

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
