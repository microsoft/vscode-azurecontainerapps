/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerAppsAPIClient, SourceControl } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { listCredentialsFromRegistry } from "../imageSource/containerRegistry/acr/listCredentialsFromRegistry";
import type { IConnectToGitHubContext } from "./IConnectToGitHubContext";

export class GitHubRepositoryConnectStep extends AzureWizardExecuteStep<IConnectToGitHubContext> {
    public priority: number = 300;

    public async execute(context: IConnectToGitHubContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsClient(context, context.subscription);
        const { username, password } = await listCredentialsFromRegistry(context, nonNullProp(context, 'registry'));

        const rgName: string = context.targetContainer.resourceGroup;
        const caName: string = context.targetContainer.name;

        const scName: string = 'current';
        const scEnvelope: SourceControl = {
            repoUrl: context.gitHubRepositoryUrl,
            branch: context.gitHubBranch,
            githubActionConfiguration: {
                contextPath: context.dockerfilePath,
                image: context.repositoryName,
                azureCredentials: {
                    clientId: context.servicePrincipalId,
                    clientSecret: context.servicePrincipalSecret,
                    tenantId: context.subscription.tenantId
                },
                registryInfo: {
                    registryUrl: context.registry?.loginServer,
                    registryUserName: username,
                    registryPassword: password.value
                }
            }
        };
        const requestOptions = {
            customHeaders: {
                'x-ms-github-auxiliary': nonNullProp(context, 'gitHubAccessToken')
            }
        };

        const connecting: string = localize('connectingRepository', 'Connecting "{0}"...', context.gitHubRepository);
        progress.report({ message: connecting });

        await client.containerAppsSourceControls.beginCreateOrUpdateAndWait(rgName, caName, scName, scEnvelope, { requestOptions });
        ext.state.notifyChildrenChanged(context.targetContainer.id);

        const gitHubRepository: string = `${context.gitHubOrg || context.gitHubRepositoryOwner}/${context.gitHubRepository}`;
        const connected: string = localize('connectedRepository', 'Connected repository "{0}" to container app "{1}".', gitHubRepository, context.targetContainer.name);
        ext.outputChannel.appendLog(connected);
    }

    public shouldExecute(): boolean {
        return true;
    }
}
