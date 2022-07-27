/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { containerAppProvider } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { ResolvedContainerAppsResource } from '../tree/ResolvedContainerAppsResource';
import { RevisionTreeItem } from '../tree/RevisionTreeItem';
import { browse } from './browse';
import { chooseRevisionMode } from './chooseRevisionMode';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { createManagedEnvironment } from './createManagedEnvironment/createManagedEnvironment';
import { deleteNode } from './deleteNode';
import { deployImage } from './deployImage/deployImage';
import { editTargetPort, toggleIngress, toggleIngressVisibility } from './ingressCommands';
import { openInPortal } from './openInPortal';
import { changeRevisionActiveState } from './revisionCommands/changeRevisionActiveState';
import { editScalingRange } from './scaling/editScalingRange';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommand('containerApps.loadMore', async (context: IActionContext, node: AzExtTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('containerApps.openInPortal', openInPortal);
    registerCommand('containerApps.refresh', async (context: IActionContext, node?: AzExtTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('containerApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('containerApps.viewProperties', viewProperties);
    registerCommand('containerApps.browse', browse);
    registerCommand('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommand('containerApps.createContainerApp', createContainerApp);
    registerCommand('containerApps.deployImage', deployImage);
    registerCommand('containerApps.deleteManagedEnvironment', async (context: IActionContext, node?: ResolvedContainerAppsResource) => await deleteNode(context, ResolvedContainerAppsResource.contextValue, node));
    registerCommand('containerApps.deleteContainerApp', async (context: IActionContext, node?: ContainerAppTreeItem) => await deleteNode(context, ContainerAppTreeItem.contextValueRegExp, node));
    registerCommand('containerApps.enableIngress', toggleIngress);
    registerCommand('containerApps.disableIngress', toggleIngress);
    registerCommand('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommand('containerApps.editTargetPort', editTargetPort);
    registerCommand('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommand('containerApps.activateRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'activate', node));
    registerCommand('containerApps.deactivateRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'deactivate', node));
    registerCommand('containerApps.restartRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'restart', node));
    registerCommand('containerApps.openConsoleInPortal', async (context: IActionContext, node?: ContainerAppTreeItem) => {
        if (!node) {
            node = await ext.rgApi.pickAppResource<ContainerAppTreeItem>(context, {
                filter: { type: containerAppProvider },
                expectedChildContextValue: ContainerAppTreeItem.contextValueRegExp
            });
        }

        await azUtil.openInPortal(node, `${node.id}/console`);
    });
    registerCommand('containerApps.editScalingRange', editScalingRange);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
