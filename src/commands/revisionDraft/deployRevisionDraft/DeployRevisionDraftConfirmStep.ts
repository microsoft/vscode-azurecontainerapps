/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import type { DeployRevisionDraftContext } from "./DeployRevisionDraftContext";

export class DeployRevisionDraftConfirmStep extends AzureWizardPromptStep<DeployRevisionDraftContext> {
    public async prompt(context: DeployRevisionDraftContext): Promise<void> {
        await context.ui.showWarningMessage(
            localize('deployRevisionWarning', 'This will deploy any unsaved changes to container app "{0}".', context.containerApp?.name),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: DeployRevisionDraftContext): boolean {
        return !!context.template;
    }
}
