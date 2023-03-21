/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerCommandWithTreeNodeUnwrapping, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { browseContainerAppNode } from './browseContainerApp';
import { chooseRevisionMode } from './chooseRevisionMode';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { createManagedEnvironment } from './createManagedEnvironment/createManagedEnvironment';
import { deleteContainerApp } from './deleteContainerApp/deleteContainerApp';
import { deleteManagedEnvironment } from './deleteManagedEnvironment/deleteManagedEnvironment';
import { deploy } from './deploy/deploy';
import { deployImageApi } from './deploy/deployImageApi';
import { disableIngress } from './ingress/disableIngress';
import { editTargetPort } from './ingress/editTargetPort';
import { enableIngress } from './ingress/enableIngress';
import { toggleIngressVisibility } from './ingress/toggleIngressVisibility';
import { openConsoleInPortal } from './openConsoleInPortal';
import { activateRevision } from './revisionCommands/activateRevision';
import { deactivateRevision } from './revisionCommands/deactivateRevision';
import { restartRevision } from './revisionCommands/restartRevision';
import { addScaleRule } from './scaling/addScaleRule/addScaleRule';
import { editScalingRange } from './scaling/editScalingRange';

export function registerCommands(): void {
    // managed environments
    registerCommandWithTreeNodeUnwrapping('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteManagedEnvironment', deleteManagedEnvironment);

    // container apps
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerApp', createContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteContainerApp', deleteContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deploy', deploy);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImageApi', deployImageApi);
    registerCommandWithTreeNodeUnwrapping('containerApps.openConsoleInPortal', openConsoleInPortal);
    registerCommandWithTreeNodeUnwrapping('containerApps.browse', browseContainerAppNode);

    // ingress
    registerCommandWithTreeNodeUnwrapping('containerApps.enableIngress', enableIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.disableIngress', disableIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommandWithTreeNodeUnwrapping('containerApps.editTargetPort', editTargetPort);

    // revisions
    registerCommandWithTreeNodeUnwrapping('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommandWithTreeNodeUnwrapping('containerApps.activateRevision', activateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.deactivateRevision', deactivateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.restartRevision', restartRevision);

    // scaling
    registerCommandWithTreeNodeUnwrapping('containerApps.editScalingRange', editScalingRange);
    registerCommandWithTreeNodeUnwrapping('containerApps.addScaleRule', addScaleRule);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
