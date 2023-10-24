/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { QuickPicksCache, loadMoreQp } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";

export abstract class RepositoryTagListStepBase extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        let result: QuickPickItem;
        const placeHolder: string = localize('selectTag', 'Select a tag');

        do {
            result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
        } while (result === loadMoreQp)

        context.tag = result.label;
    }

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
        return !context.tag;
    }

    public abstract getPicks(context: ContainerRegistryImageSourceContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
