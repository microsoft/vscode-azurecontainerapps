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
import { deployImage } from './deployImage/deployImage';
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
    registerCommandWithTreeNodeUnwrapping('containerApps.browse', browseContainerAppNode);
    registerCommandWithTreeNodeUnwrapping('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerApp', createContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImage', deployImage);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteManagedEnvironment', deleteManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteContainerApp', deleteContainerApp);

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

    registerCommandWithTreeNodeUnwrapping('containerApps.openConsoleInPortal', openConsoleInPortal);

    // scaling
    registerCommandWithTreeNodeUnwrapping('containerApps.editScalingRange', editScalingRange);
    registerCommandWithTreeNodeUnwrapping('containerApps.addScaleRule', addScaleRule);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
