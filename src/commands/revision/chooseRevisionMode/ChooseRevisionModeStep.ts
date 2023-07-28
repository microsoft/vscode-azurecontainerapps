/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IChooseRevisionModeContext } from "./IChooseRevisionModeContext";

export class ChooseRevisionModeStep extends AzureWizardPromptStep<IChooseRevisionModeContext> {
    public async prompt(context: IChooseRevisionModeContext): Promise<void> {
        context.newRevisionMode = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder: localize('chooseRevision', 'Choose revision mode'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: IChooseRevisionModeContext): boolean {
        return !context.newRevisionMode;
    }

    private getPicks(context: IChooseRevisionModeContext): IAzureQuickPickItem<KnownActiveRevisionsMode>[] {
        return [
            {
                label: localize('multiple', 'Multiple'),
                description: appendCurrent(context, localize('multipleDesc', 'Several revisions active simultaneously'), KnownActiveRevisionsMode.Multiple),
                data: KnownActiveRevisionsMode.Multiple,
            },
            {
                label: localize('single', 'Single'),
                description: appendCurrent(context, localize('singleDesc', 'One active revision at a time'), KnownActiveRevisionsMode.Single),
                data: KnownActiveRevisionsMode.Single,
            },
        ];
    }
}

function appendCurrent(context: IChooseRevisionModeContext, description: string, revisionsMode: KnownActiveRevisionsMode): string {
    return revisionsMode === context.containerApp?.revisionsMode ? `${description} (current)` : description;
}
