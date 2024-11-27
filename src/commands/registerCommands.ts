/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerCommand, registerCommandWithTreeNodeUnwrapping, registerErrorHandler, registerReportIssueCommand, type IActionContext } from '@microsoft/vscode-azext-utils';
import { type EnvironmentVariableItem } from '../tree/containers/EnvironmentVariableItem';
import { browseContainerAppNode } from './browseContainerApp';
import { createContainerApp } from './createContainerApp/createContainerApp';
import { createManagedEnvironment } from './createManagedEnvironment/createManagedEnvironment';
import { deleteContainerApp } from './deleteContainerApp/deleteContainerApp';
import { deleteManagedEnvironment } from './deleteManagedEnvironment/deleteManagedEnvironment';
import { deployWorkspaceProject } from './deployWorkspaceProject/deployWorkspaceProject';
import { editContainer } from './editContainer/editContainer';
import { editContainerImage } from './editContainer/editContainerImage/editContainerImage';
import { editContainerApp } from './editContainerApp';
import { connectToGitHub } from './gitHub/connectToGitHub/connectToGitHub';
import { disconnectRepo } from './gitHub/disconnectRepo/disconnectRepo';
import { openGitHubRepo } from './gitHub/openGitHubRepo';
import { deployImageApi } from './image/deployImageApi/deployImageApi';
import { createAcr } from './image/imageSource/containerRegistry/acr/createAcr/createAcr';
import { openAcrBuildLogs } from './image/openAcrBuildLogs';
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
import { editScaleRange } from './scaling/scaleRange/editScaleRange';
import { addScaleRule } from './scaling/scaleRule/addScaleRule/addScaleRule';
import { deleteScaleRule } from './scaling/scaleRule/deleteScaleRule/deleteScaleRule';
import { addSecret } from './secret/addSecret/addSecret';
import { deleteSecret } from './secret/deleteSecret/deleteSecret';
import { editSecretValue } from './secret/editSecret/editSecretValue';
import { addWorkspaceProjectWalkthrough } from './walkthrough/addWorkspaceProject';
import { azureSignInWalkthrough } from './walkthrough/azureSignIn';
import { cleanUpResourcesWalkthrough } from './walkthrough/cleanUpResources';
import { deployWorkspaceProjectWalkthrough } from './walkthrough/deployWorkspaceProject';
import { gettingStartedInternalWalkthrough } from './walkthrough/gettingStartedInternal';

export function registerCommands(): void {
    // managed environments
    registerCommandWithTreeNodeUnwrapping('containerApps.createManagedEnvironment', createManagedEnvironment);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteManagedEnvironment', deleteManagedEnvironment);

    // container apps
    registerCommandWithTreeNodeUnwrapping('containerApps.browse', browseContainerAppNode);
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerApp', createContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.createContainerAppFromWorkspace', deployWorkspaceProject);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteContainerApp', deleteContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.editContainerApp', editContainerApp);
    registerCommandWithTreeNodeUnwrapping('containerApps.openConsoleInPortal', openConsoleInPortal);
    registerCommandWithTreeNodeUnwrapping('containerApps.toggleEnvironmentVariableVisibility',
        async (context: IActionContext, item: EnvironmentVariableItem) => {
            await item.toggleValueVisibility(context);
        });

    // containers
    registerCommandWithTreeNodeUnwrapping('containerApps.editContainer', editContainer);
    registerCommandWithTreeNodeUnwrapping('containerApps.updateContainerImage', editContainerImage);

    // deploy
    registerCommandWithTreeNodeUnwrapping('containerApps.deployImageApi', deployImageApi);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployRevisionDraft', deployRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployWorkspaceProject', deployWorkspaceProject);
    registerCommandWithTreeNodeUnwrapping('containerApps.deployWorkspaceProjectToContainerApp', deployWorkspaceProject);

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
    registerCommandWithTreeNodeUnwrapping('containerApps.editSecretValue', editSecretValue);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteSecret', deleteSecret);

    // revisions
    registerCommandWithTreeNodeUnwrapping('containerApps.chooseRevisionMode', chooseRevisionMode);
    registerCommandWithTreeNodeUnwrapping('containerApps.activateRevision', activateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.deactivateRevision', deactivateRevision);
    registerCommandWithTreeNodeUnwrapping('containerApps.restartRevision', restartRevision);

    // revision draft
    registerCommandWithTreeNodeUnwrapping('containerApps.createRevisionDraft', createRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.editRevisionDraft', editRevisionDraft);
    registerCommandWithTreeNodeUnwrapping('containerApps.discardRevisionDraft', discardRevisionDraft);

    // scaling
    registerCommandWithTreeNodeUnwrapping('containerApps.editScaleRange', editScaleRange);
    registerCommandWithTreeNodeUnwrapping('containerApps.addScaleRule', addScaleRule);
    registerCommandWithTreeNodeUnwrapping('containerApps.deleteScaleRule', deleteScaleRule);

    //log streaming
    registerCommandWithTreeNodeUnwrapping('containerApps.startStreamingLogs', startStreamingLogs);
    registerCommandWithTreeNodeUnwrapping('containerApps.stopStreamingLogs', stopStreamingLogs);

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');

    // registries
    registerCommand('containerApps.createAcr', createAcr);
    registerCommand('containerApps.openAcrBuildLogs', openAcrBuildLogs);

    // walkthrough
    registerCommand('containerApps.walkthrough.gettingStarted.internal', gettingStartedInternalWalkthrough);
    registerCommand('containerApps.walkthrough.addWorkspaceProject', addWorkspaceProjectWalkthrough);
    registerCommand('containerApps.walkthrough.azureSignIn', azureSignInWalkthrough);
    registerCommand('containerApps.walkthrough.deployWorkspaceProject', deployWorkspaceProjectWalkthrough);
    registerCommand('containerApps.walkthrough.cleanUpResources', cleanUpResourcesWalkthrough);
}
