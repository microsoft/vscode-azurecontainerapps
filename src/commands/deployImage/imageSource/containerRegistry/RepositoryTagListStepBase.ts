/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { QuickPicksCache, loadMoreQp } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import type { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";

export abstract class RepositoryTagListStepBase extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        let result: QuickPickItem;
        const placeHolder: string = localize('selectTag', 'Select a tag');

        do {
            result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
        } while (result === loadMoreQp)

        context.tag = result.label;
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.tag;
    }

    public abstract getPicks(context: IContainerRegistryImageContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
