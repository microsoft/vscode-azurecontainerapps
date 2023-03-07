/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { loadMoreQp, QuickPicksCache } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IContainerAppContext } from "../../createContainerApp/IContainerAppContext";
import { IDeployFromRegistryContext } from "./IDeployFromRegistryContext";

export abstract class RegistryRepositoriesListStepBase extends AzureWizardPromptStep<IDeployFromRegistryContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const picksCache: QuickPicksCache = { cache: [], next: null };
        const placeHolder: string = localize('selectRepo', 'Select a repository');
        let result: QuickPickItem;

        do {
            result = await context.ui.showQuickPick(this.getPicks(context, picksCache), { placeHolder });
        } while (result === loadMoreQp)

        context.repositoryName = result.label;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.repositoryName;
    }

    public abstract getPicks(context: IDeployFromRegistryContext, picksCache: QuickPicksCache | undefined): Promise<QuickPickItem[]>
}
