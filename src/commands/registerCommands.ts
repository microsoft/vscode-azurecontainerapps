/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerCommandWithTreeNodeUnwrapping, registerErrorHandler, registerReportIssueCommand } from '@microsoft/vscode-azext-utils';
import { browseContainerAppNode } from './browseContainerApp';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { createManagedEnvironment } from './createManagedEnvironment/createManagedEnvironment';
import { deleteContainerApp } from './deleteContainerApp/deleteContainerApp';
import { deleteManagedEnvironment } from './deleteManagedEnvironment/deleteManagedEnvironment';
import { deployImage } from './deployImage/deployImage';
import { deployImageApi } from './deployImage/deployImageApi';
import { editContainerApp } from './editContainerApp';
import { connectToGitHub } from './gitHub/connectToGitHub/connectToGitHub';
import { disconnectRepo } from './gitHub/disconnectRepo/disconnectRepo';
import { openGitHubRepo } from './gitHub/openGitHubRepo';
import { disableIngress } from './ingress/disableIngress/disableIngress';
import { editTargetPort } from './ingress/editTargetPort/editTargetPort';
import { enableIngress } from './ingress/enableIngress/enableIngress';
import { toggleIngressVisibility } from './ingress/toggleIngressVisibility/toggleIngressVisibility';
import { startStreamingLogs } from './logStream/startStreamingLogs';
import { stopStreamingLogs } from './logStream/stopStreamingLogs';
import { openConsoleInPortal } from './openConsoleInPortal';
import { activateRevision } from './revision/activateRevision';
import { chooseRevisionMode } from './revision/chooseRevisionMode/chooseRevisionMode';
import { deactivateRevision } from './revision/deactivateRevision';
import { restartRevision } from './revision/restartRevision';
import { createRevisionDraft } from './revisionDraft/createRevisionDraft';
import { deployRevisionDraft } from './revisionDraft/deployRevisionDraft/deployRevisionDraft';
import { discardRevisionDraft } from './revisionDraft/discardRevisionDraft';
import { editRevisionDraft } from './revisionDraft/editRevisionDraft';
import { addScaleRule } from './scaling/addScaleRule/addScaleRule';
import { editScalingRange } from './scaling/editScalingRange';
import { addSecret } from './secret/addSecret/addSecret';

export function registerCommands(): void {
    // managed environments
    registerCommandWithTreeNodeUnwrapping('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteManagedEnvironment', deleteManagedEnvironment);

    // container apps
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerApp', createContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.editContainerApp', editContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteContainerApp', deleteContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImage', deployImage);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImageApi', deployImageApi);
    registerCommandWithTreeNodeUnwrapping('containerApps.openConsoleInPortal', openConsoleInPortal);
    registerCommandWithTreeNodeUnwrapping('containerApps.browse', browseContainerAppNode);

    // github
    registerCommandWithTreeNodeUnwrapping('containerApps.connectToGitHub', connectToGitHub);
    registerCommandWithTreeNodeUnwrapping('containerApps.disconnectRepo', disconnectRepo);
    registerCommandWithTreeNodeUnwrapping('containerApps.openGitHubRepo', openGitHubRepo);

    // ingress
    registerCommandWithTreeNodeUnwrapping('containerApps.enableIngress', enableIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.disableIngress', disableIngress);
    registerCommandWithTreeNodeUnwrapping('containerApps.toggleVisibility', toggleIngressVisibility);
    registerCommandWithTreeNodeUnwrapping('containerApps.editTargetPort', editTargetPort);

    // secret
    registerCommandWithTreeNodeUnwrapping('containerApps.addSecret', addSecret);

    // revisions
    registerCommandWithTreeNodeUnwrapping('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommandWithTreeNodeUnwrapping('containerApps.activateRevision', activateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.deactivateRevision', deactivateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.restartRevision', restartRevision);

    // revision draft
    registerCommandWithTreeNodeUnwrapping('containerApps.createRevisionDraft', createRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.editRevisionDraft', editRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployRevisionDraft', deployRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.discardRevisionDraft', discardRevisionDraft);

    // scaling
    registerCommandWithTreeNodeUnwrapping('containerApps.editScalingRange', editScalingRange);
    registerCommandWithTreeNodeUnwrapping('containerApps.addScaleRule', addScaleRule);

    //log streaming
    registerCommandWithTreeNodeUnwrapping('containerApps.startStreamingLogs', startStreamingLogs);
    registerCommandWithTreeNodeUnwrapping('containerApps.stopStreamingLogs', stopStreamingLogs);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
