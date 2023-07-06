/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { QuickPicksCache, loadMoreQp } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";

export abstract class RegistryRepositoriesListStepBase extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        const placeHolder: string = localize('selectRepo', 'Select a repository');
        let result: QuickPickItem;

        do {
            result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
        } while (result === loadMoreQp)

        context.repositoryName = result.label;
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.repositoryName;
    }

    public abstract getPicks(context: IContainerRegistryImageContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
