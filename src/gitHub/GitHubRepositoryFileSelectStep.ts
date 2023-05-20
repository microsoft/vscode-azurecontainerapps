/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { IGitHubContext } from "./IGitHubContext";
import { GetRepoContentReqParams, RepoContent, getRepositoryContent } from "./getRepositoryContent";

type ContentPickData = {
    traverse?: 'Up' | 'Down',
    contentName: string;
}

export class GitHubRepositoryFileSelectStep extends AzureWizardPromptStep<IGitHubContext> {
    private cachedPicks: Map<string, IAzureQuickPickItem<ContentPickData>[]>;

    private readonly fileName: RegExp;
    private readonly contextKey: string;
    private readonly promptPlaceHolder: string;

    constructor (fileName: RegExp | string, contextKey: string, prompt: string) {
        super();
        this.fileName = fileName instanceof RegExp ? fileName : new RegExp(fileName);
        this.contextKey = contextKey;
        this.promptPlaceHolder = prompt;
    }

    public async prompt(context: IGitHubContext): Promise<void> {
        // Reset cache when prompting in case the user has made changes via the back button
        this.cachedPicks = new Map();

        let path: string = '';
        while (true) {
            const contentPickData = (await context.ui.showQuickPick(this.getPicks(context, path), { placeHolder: this.promptPlaceHolder })).data;

            if (contentPickData.traverse === 'Up') {
                path = path.split('/').slice(0, -1).join('/');
            } else if (contentPickData.traverse === 'Down') {
                path += '/' + contentPickData.contentName;
            }

            if (this.fileName.test(contentPickData.contentName)) {
                break;
            }
        }

        context[this.contextKey] = path;
        context.valuesToMask.push(path);
    }

    public shouldPrompt(context: IGitHubContext): boolean {
        return !context[this.contextKey];
    }

    private async getPicks(context: IGitHubContext, path: string): Promise<IAzureQuickPickItem<ContentPickData>[]> {
        // Prefer cached picks when possible to reduce the number of remote calls required
        let remotePicks: IAzureQuickPickItem<ContentPickData>[] = [];
        if (!this.cachedPicks.has(path)) {
            remotePicks = await this.getRemotePicks(context, path);
            this.cachedPicks.set(path, remotePicks);
        }

        return this.cachedPicks.get(path) ?? remotePicks;
    }

    private async getRemotePicks(context: IGitHubContext, path: string): Promise<IAzureQuickPickItem<ContentPickData>[]> {
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
        const filteredContents = contents.filter((content) => content.type === 'dir' || this.fileName.test(content.name));

        const picks: IAzureQuickPickItem<ContentPickData>[] = filteredContents.map((content) => {
            const endsWith: string = content.type === 'dir' ? '/' : '';
            return {
                label: content.name + endsWith,
                suppressPersistence: true,
                data: { traverse: 'Down', contentName: content.name } };
        });

        const operationPicks: IAzureQuickPickItem<ContentPickData>[] = [
            // '.' is useful as a pick for showing the full path
            {
                label: '.',
                description: path + '/',
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
