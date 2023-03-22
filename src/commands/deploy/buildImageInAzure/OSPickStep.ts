/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

export class OSPickStep extends AzureWizardPromptStep<IBuildImageInAzureContext> {
    public async prompt(context: IBuildImageInAzureContext): Promise<void> {
        const placeHolder: string = localize('imageOSPrompt', 'Select image base OS');
        const picks: IAzureQuickPickItem<'Windows' | 'Linux'>[] = [
            { label: 'Linux', data: 'Linux', suppressPersistence: true },
            { label: 'Windows', data: 'Windows', suppressPersistence: true },
        ];

        context.os = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IBuildImageInAzureContext): boolean {
        return !context.os;
    }
}
