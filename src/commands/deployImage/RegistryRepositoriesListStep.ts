/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";
import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { createContainerRegistryClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { IContainerAppContext } from "../createContainerApp/IContainerAppContext";

export class RegistryRepositoriesListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const client = createContainerRegistryClient(nonNullValue(context.registry));
        const repositoryNames: string[] = []

        for await (const repository of client.listRepositoryNames()) {
            repositoryNames.push(repository);
        }
        const picks: QuickPickItem[] = repositoryNames.map((rn) => { return { label: rn } });

        const placeHolder: string = localize('selectRepo', 'Select a repository');
        context.repositoryName = (await context.ui.showQuickPick(picks, { placeHolder })).label;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.repositoryName;
    }
}
