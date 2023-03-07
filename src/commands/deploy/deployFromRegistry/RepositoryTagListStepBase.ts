/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { loadMoreQp, QuickPicksCache } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IDeployFromRegistryContext } from "./IDeployFromRegistryContext";

export abstract class RepositoryTagListStepBase extends AzureWizardPromptStep<IDeployFromRegistryContext> {
    public async prompt(context: IDeployFromRegistryContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        let result: QuickPickItem;
        const placeHolder: string = localize('selectTag', 'Select a tag');

        do {
            result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
        } while (result === loadMoreQp)

        context.tag = result.label;
    }

    public shouldPrompt(context: IDeployFromRegistryContext): boolean {
        return !context.tag;
    }

    public abstract getPicks(context: IDeployFromRegistryContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
