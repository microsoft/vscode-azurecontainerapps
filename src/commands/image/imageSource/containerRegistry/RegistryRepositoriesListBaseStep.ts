/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { QuickPicksCache, loadMoreQp, noMatchingResourcesQp } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";

export abstract class RegistryRepositoriesListStepBase extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        const placeHolder: string = localize('selectRepo', 'Select a repository');
        let result: QuickPickItem | undefined;

        do {
            if (result === noMatchingResourcesQp) {
                // Don't need to store any data since there's only one pick available
                await context.ui.showQuickPick([noMatchingResourcesQp], { placeHolder });
            } else {
                result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
            }
        } while (result === noMatchingResourcesQp || result === loadMoreQp)

        context.repositoryName = result.label;
    }

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
        return !context.repositoryName;
    }

    public abstract getPicks(context: ContainerRegistryImageSourceContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
