/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { QuickPicksCache, loadMoreQp, noMatchingResourceQp } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import type { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";

export abstract class RegistryRepositoriesListStepBase extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        const placeHolder: string = localize('selectRepo', 'Select a repository');
        let result: QuickPickItem | undefined;

        do {
            if (result === noMatchingResourceQp) {
                // Don't need to store any data since there's only one pick available
                await context.ui.showQuickPick([noMatchingResourceQp], { placeHolder });
            } else {
                result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
            }
        } while (result === noMatchingResourceQp || result === loadMoreQp)

        context.repositoryName = result.label;
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.repositoryName;
    }

    public abstract getPicks(context: IContainerRegistryImageContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
