/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type ISecretContext } from "../ISecretContext";

export class SecretDeleteConfirmStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        await context.ui.showWarningMessage(
            localize('secretDeleteWarning', 'Are you sure you want to delete secret "{0}"? Restarting revisions that use it will fail once the secret is deleted.', nonNullProp(context, 'secretName')),
            { modal: true },
            { title: localize('delete', 'Delete') }
        );
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !!context.secretName;
    }
}
