/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { ISecretContext } from "../ISecretContext";

export class SecretDeleteConfirmStep extends AzureWizardPromptStep<ISecretContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: ISecretContext): Promise<void> {
        const warning: string = localize('secretDeleteWarning', 'Are you sure you want to delete secret "{0}"?', nonNullValueAndProp(context.secret, 'name'));

        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, { title: localize('delete', 'Delete') });
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !!context.secret;
    }
}
