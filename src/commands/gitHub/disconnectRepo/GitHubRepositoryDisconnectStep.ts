/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerAppsAPIClient, SourceControl } from "@azure/arm-appcontainers";
import { gitHubUrlParse } from "@microsoft/vscode-azext-github";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { createContainerAppsClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { getContainerAppSourceControl } from "../connectToGitHub/getContainerAppSourceControl";
import type { IDisconnectRepoContext } from "./IDisconnectRepoContext";

export class GitHubRepositoryDisconnectStep extends AzureWizardExecuteStep<IDisconnectRepoContext> {
    public priority: number = 300;

    public async execute(context: IDisconnectRepoContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsClient(context, context.subscription);
        const sourceControl: SourceControl | undefined = await getContainerAppSourceControl(context, context.subscription, context.containerApp);

        const { ownerOrOrganization: owner, repositoryName: repo } = gitHubUrlParse(sourceControl?.repoUrl);

        const rgName: string = context.containerApp.resourceGroup;
        const caName: string = context.containerApp.name;
        const scName: string = 'current';

        const requestOptions = {
            customHeaders: {
                'x-ms-github-auxiliary': nonNullProp(context, 'gitHubAccessToken')
            }
        };

        const disconnecting: string = localize('disconnectingRepository', 'Disconnecting "{0}"...', repo);
        progress.report({ message: disconnecting });

        await client.containerAppsSourceControls.beginDeleteAndWait(rgName, caName, scName, { requestOptions });
        ext.state.notifyChildrenChanged(context.containerApp.id);

        const disconnected: string = localize('disconnectedRepository', 'Disconnected repository "{0}" from container app "{1}".', `${owner}/${repo}`, context.containerApp.name);
        ext.outputChannel.appendLog(disconnected);
    }

    public shouldExecute(): boolean {
        return true;
    }
}
