/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { SourceControl } from "@azure/arm-appcontainers";
import { IActionContext, TreeElementBase, callWithTelemetryAndErrorHandling, createGenericElement } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as gitUrlParse from "git-url-parse";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { getContainerAppSourceControl } from "../../commands/connectToGitHub/getContainerAppSourceControl";
import { ActionsListWorkflowRuns, GetActionsListWorkflowRunsParams, getActions } from "../../gitHub/getActions";
import { localize } from "../../utils/localize";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";
import { ActionTreeItem } from "./ActionTreeItem";

export class ActionsTreeItem implements ContainerAppsItem {
    static contextValueConnected: string = 'containerActionsConnected';
    static contextValueUnconnected: string = 'containerActionsUnconnected';

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel) { }

    id = `${this.containerApp.id}/actions`;

    async getTreeItem(): Promise<TreeItem> {
        const sourceControl: SourceControl | undefined = await this.getSourceControl();
        return {
            id: this.id,
            label: 'Actions',
            description: sourceControl ? localize('connected', 'Connected') : '',
            iconPath: new ThemeIcon('github-inverted'),
            contextValue: sourceControl ? ActionsTreeItem.contextValueConnected : ActionsTreeItem.contextValueUnconnected,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const sourceControl: SourceControl | undefined = await this.getSourceControl();
        const actionsListWorkflowRuns: ActionsListWorkflowRuns | undefined = await callWithTelemetryAndErrorHandling('getActionsChildren', async (context: IActionContext) => {
            if (!sourceControl) {
                return undefined;
            }

            const { owner, name: repo } = gitUrlParse(sourceControl.repoUrl ?? '');
            const actionWorkflowRunsParams: GetActionsListWorkflowRunsParams = {
                owner,
                repo,
                branch: sourceControl.branch ?? 'main',
                page: -1,
            };

            return await getActions(context, actionWorkflowRunsParams);
        });

        if (actionsListWorkflowRuns && actionsListWorkflowRuns.total_count > 0) {
            return actionsListWorkflowRuns.workflow_runs.map((awr) => new ActionTreeItem(awr));
        } else if (sourceControl) {
            // If we are able to detect a connection but fail to retrieve a list of actions, return 'noActionsDetected'
            return [
                createGenericElement({
                    contextValue: 'noActionsDetected',
                    id: `${this.containerApp.id}/noActionsDetected`,
                    label: localize('noActionsDetected', 'No actions detected'),
                })
            ];
        } else {
            return [
                createGenericElement({
                    contextValue: 'connectToGithub',
                    id: `${this.containerApp.id}/connectToGithub`,
                    label: localize('connectToGithub', 'Connect to a GitHub Repository...'),
                    commandId: 'containerApps.connectToGithub',
                    commandArgs: [ { containerApp: this.containerApp, subscription: this.subscription } ]
                })
            ];
        }
    }

    // If this call returns a defined value, then we can also assume the Container App is connected to a GitHub repository
    private async getSourceControl(): Promise<SourceControl | undefined> {
        return await callWithTelemetryAndErrorHandling('getSourceControl',
            (context: IActionContext) => getContainerAppSourceControl(context, this.subscription, this.containerApp));
    }
}
