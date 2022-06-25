/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { appFilter } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppResource } from '../resolver/ContainerAppResource';
import { ContainerAppExtParentTreeItem } from '../tree/ContainerAppExtParentTreeItem';
import { ContainerAppExtTreeItem } from '../tree/ContainerAppExtTreeItem';
import { RevisionResource } from '../tree/RevisionResource';
import { browse } from './browse';
import { chooseRevisionMode } from './chooseRevisionMode';
import { createContainerApp } from './containerApp/create/createContainerApp';
import { deleteContainerApp } from './containerApp/delete/deleteContainerApp';
import { deployImage } from './containerApp/deployImage/deployImage';
import { editTargetPort, toggleIngress, toggleIngressVisibility } from './ingressCommands';
import { createManagedEnvironment } from './managedEnvironments/create/createManagedEnvironment';
import { deleteManagedEnvironment } from './managedEnvironments/delete/deleteManagedEnvironment';
import { changeRevisionActiveState } from './revisionCommands/changeRevisionActiveState';
import { editScalingRange } from './scaling/editScalingRange';

export function registerCommands(): void {
    registerCommand('containerApps.loadMore', async (context: IActionContext, node: AzExtTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('containerApps.refresh', async (context: IActionContext, node?: AzExtTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('containerApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('containerApps.browse', browse);
    registerCommand('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommand('containerApps.createContainerApp', createContainerApp);
    registerCommand('containerApps.deployImage', deployImage);
    registerCommand('containerApps.deleteManagedEnvironment', deleteManagedEnvironment);
    registerCommand('containerApps.deleteContainerApp', deleteContainerApp);
    registerCommand('containerApps.enableIngress', toggleIngress);
    registerCommand('containerApps.disableIngress', toggleIngress);
    registerCommand('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommand('containerApps.editTargetPort', editTargetPort);
    registerCommand('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommand('containerApps.activateRevision', async (context: IActionContext, node?: ContainerAppExtTreeItem<RevisionResource>) => await changeRevisionActiveState(context, 'activate', node));
    registerCommand('containerApps.deactivateRevision', async (context: IActionContext, node?: ContainerAppExtTreeItem<RevisionResource>) => await changeRevisionActiveState(context, 'deactivate', node));
    registerCommand('containerApps.restartRevision', async (context: IActionContext, node?: ContainerAppExtTreeItem<RevisionResource>) => await changeRevisionActiveState(context, 'restart', node));
    registerCommand('containerApps.openConsoleInPortal', async (context: IActionContext, node?: ContainerAppExtParentTreeItem<ContainerAppResource>) => {
        if (!node) {
            node = await ext.rgApi.pickAppResource(context, {
                filter: appFilter,
            }) as ContainerAppExtParentTreeItem<ContainerAppResource>;
        }

        await azUtil.openInPortal(node.subscription, `${node.id}/console`);
    });
    registerCommand('containerApps.editScalingRange', editScalingRange);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
