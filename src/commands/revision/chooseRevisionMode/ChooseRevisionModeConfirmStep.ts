/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import type { IChooseRevisionModeContext } from "./IChooseRevisionModeContext";

export class ChooseRevisionModeConfirmStep extends AzureWizardPromptStep<IChooseRevisionModeContext> {
    public async prompt(context: IChooseRevisionModeContext): Promise<void> {
        await context.ui.showWarningMessage(
            localize('chooseRevisionWarning', 'Changing modes will discard any unsaved changes for "{0}".', context.containerApp?.name),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: IChooseRevisionModeContext): boolean {
        return !!context.hasRevisionDraft && context.containerApp?.revisionsMode !== context.newRevisionMode;
    }
}
