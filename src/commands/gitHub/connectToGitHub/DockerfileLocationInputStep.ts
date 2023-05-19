/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { GetRepoContentReqParams, RepoContent, getRepositoryContent } from "../../../gitHub/getRepositoryContent";
import { localize } from "../../../utils/localize";
import type { IConnectToGitHubContext } from "./IConnectToGitHubContext";

type ContentPickData = {
    traverse?: 'Up' | 'Down',
    contentName: string;
}

// 'Dockerfile' we supply is case sensitive and must match this exactly to successfully complete the action
const dockerfile: string = 'Dockerfile';

export class DockerfileLocationInputStep extends AzureWizardPromptStep<IConnectToGitHubContext> {
    private cachedPicks: Map<string, IAzureQuickPickItem<ContentPickData>[]>;

    public async prompt(context: IConnectToGitHubContext): Promise<void> {
        // Reset cache when prompting in case the user has made changes via the back button
        this.cachedPicks = new Map();

        const placeHolder: string = localize('dockerfileLocationPrompt', "Select a 'Dockerfile' in the repository.");

        let path: string = '';
        while (true) {
            const contentPickData = (await context.ui.showQuickPick(this.getPicks(context, path), { placeHolder })).data;

            if (contentPickData.traverse === 'Up') {
                path = path.split('/').slice(0, -1).join('/');
            } else if (contentPickData.traverse === 'Down') {
                path += '/' + contentPickData.contentName;
            }

            if (contentPickData.contentName === dockerfile) {
                break;
            }
        }

        context.dockerfilePath = path;
        context.valuesToMask.push(path);
    }

    public shouldPrompt(context: IConnectToGitHubContext): boolean {
        return !context.dockerfilePath;
    }

    private async getPicks(context: IConnectToGitHubContext, path: string): Promise<IAzureQuickPickItem<ContentPickData>[]> {
        // Prefer cached picks when possible to reduce the number of remote calls required
        let remotePicks: IAzureQuickPickItem<ContentPickData>[] = [];
        if (!this.cachedPicks.has(path)) {
            remotePicks = await this.getRemotePicks(context, path);
            this.cachedPicks.set(path, remotePicks);
        }

        return this.cachedPicks.get(path) ?? remotePicks;
    }

    private async getRemotePicks(context: IConnectToGitHubContext, path: string): Promise<IAzureQuickPickItem<ContentPickData>[]> {
        const repoContentParams: GetRepoContentReqParams = {
            owner: context.gitHubOrg ?? context.gitHubRepositoryOwner ?? '',
            repo: nonNullProp(context, 'gitHubRepository'),
            path
        };

        let contents: RepoContent = await getRepositoryContent(context, repoContentParams);
        if (!Array.isArray(contents)) {
            contents = [contents];
        }

        // Only show directories or Dockerfiles, anything else is unnecessary and clutters the UI
        const filteredContents = contents.filter((content) => content.type === 'dir' || content.name === dockerfile);

        const picks: IAzureQuickPickItem<ContentPickData>[] = filteredContents.map((content) => {
            const endsWith: string = content.type === 'dir' ? '/' : '';
            const label: string = content.name + endsWith;
            return {
                label,
                suppressPersistence: true,
                data: { traverse: 'Down', contentName: content.name } };
        });

        const operationPicks: IAzureQuickPickItem<ContentPickData>[] = [
            {
                label: '.',
                description: (path || '/') + '/',
                suppressPersistence: true,
                data: { traverse: undefined, contentName: '' }
            },
            {
                label: '..',
                description: path.split('/').slice(0, -1).join('/') + '/',
                suppressPersistence: true,
                data: { traverse: 'Up', contentName: '' }
            }
        ];

        return path ? [...operationPicks, ...picks] : [...picks];
    }
}
