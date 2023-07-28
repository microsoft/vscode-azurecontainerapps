/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import type { IDeployRevisionDraftContext } from "./IDeployRevisionDraftContext";

export class DeployRevisionDraftConfirmStep extends AzureWizardPromptStep<IDeployRevisionDraftContext> {
    public async prompt(context: IDeployRevisionDraftContext): Promise<void> {
        await context.ui.showWarningMessage(
            localize('deployRevisionWarning', 'This will deploy any unsaved changes to container app "{0}".', context.containerApp?.name),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: IDeployRevisionDraftContext): boolean {
        return !!context.template;
    }
}
