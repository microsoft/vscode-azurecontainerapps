/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { SourceControl } from "@azure/arm-appcontainers";
import { ActionsItemBase, ConnectToGitHubCommand, GitHubSourceControl } from "@microsoft/vscode-azext-github";
import { IActionContext, callWithTelemetryAndErrorHandling, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { getContainerAppSourceControl } from "../../commands/gitHub/connectToGitHub/getContainerAppSourceControl";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";

export class ActionsItem extends ActionsItemBase implements ContainerAppsItem {
    constructor(
        parentId: string,
        contextValueExtensionPrefix: string,
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
    ) {
        super(parentId, contextValueExtensionPrefix);
    }

    async getSourceControl(): Promise<GitHubSourceControl | undefined> {
        const sourceControl: SourceControl | undefined = await callWithTelemetryAndErrorHandling('getSourceControl',
            (context: IActionContext) => getContainerAppSourceControl(context, this.subscription, this.containerApp));

        if (!sourceControl) {
            return undefined;
        }

        return { repoUrl: nonNullProp(sourceControl, 'repoUrl'), repoBranch: sourceControl.branch };
    }

    getConnectToGitHubCommand(): Promise<ConnectToGitHubCommand> {
        return Promise.resolve({
            commandId: 'containerApps.connectToGitHub',
            commandArgs: [{ containerApp: this.containerApp, subscription: this.subscription }]
        });
    }
}
