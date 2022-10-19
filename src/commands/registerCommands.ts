/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { IActionContext, registerCommandWithTreeNodeUnwrapping, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { commands } from 'vscode';
import { rootFilter } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { ManagedEnvironmentTreeItem } from '../tree/ManagedEnvironmentTreeItem';
import { RevisionTreeItem } from '../tree/RevisionTreeItem';
import { browse } from './browse';
import { chooseRevisionMode } from './chooseRevisionMode';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { createManagedEnvironment } from './createManagedEnvironment/createManagedEnvironment';
import { deleteNode } from './deleteNode';
import { deployImage } from './deployImage/deployImage';
import { editTargetPort, toggleIngress, toggleIngressVisibility } from './ingressCommands';
import { openLogsInPortal } from './openLogsInPortal';
import { changeRevisionActiveState } from './revisionCommands/changeRevisionActiveState';
import { addScaleRule } from './scaling/addScaleRule/addScaleRule';
import { editScalingRange } from './scaling/editScalingRange';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {
    registerCommandWithTreeNodeUnwrapping('containerApps.viewProperties', viewProperties);
    registerCommandWithTreeNodeUnwrapping('containerApps.openLogsInPortal', openLogsInPortal);
    registerCommandWithTreeNodeUnwrapping('containerApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommandWithTreeNodeUnwrapping('containerApps.browse', browse);
    registerCommandWithTreeNodeUnwrapping('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerApp', createContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImage', deployImage);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteManagedEnvironment', async (context: IActionContext, node?: ManagedEnvironmentTreeItem) => await deleteNode(context, ManagedEnvironmentTreeItem.contextValueRegExp, node));
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteContainerApp', async (context: IActionContext, node?: ContainerAppTreeItem) => await deleteNode(context, ContainerAppTreeItem.contextValueRegExp, node));
    registerCommandWithTreeNodeUnwrapping('containerApps.enableIngress', toggleIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.disableIngress', toggleIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommandWithTreeNodeUnwrapping('containerApps.editTargetPort', editTargetPort);
    registerCommandWithTreeNodeUnwrapping('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommandWithTreeNodeUnwrapping('containerApps.activateRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'activate', node));
    registerCommandWithTreeNodeUnwrapping('containerApps.deactivateRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'deactivate', node));
    registerCommandWithTreeNodeUnwrapping('containerApps.restartRevision', async (context: IActionContext, node?: RevisionTreeItem) => await changeRevisionActiveState(context, 'restart', node));
    registerCommandWithTreeNodeUnwrapping('containerApps.openConsoleInPortal', async (context: IActionContext, node?: ContainerAppTreeItem) => {
        if (!node) {
            node = await ext.rgApi.pickAppResource<ContainerAppTreeItem>(context, {
                filter: rootFilter,
                expectedChildContextValue: ContainerAppTreeItem.contextValueRegExp
            });
        }
        await azUtil.openInPortal(node, `${node.id}/console`);
    });
    registerCommandWithTreeNodeUnwrapping('containerApps.editScalingRange', editScalingRange);
    registerCommandWithTreeNodeUnwrapping('containerApps.addScaleRule', addScaleRule);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
