/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { IngressConstants } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IngressContext } from "../IngressContext";

export class IngressVisibilityStep extends AzureWizardPromptStep<IngressContext> {
    public async prompt(context: IngressContext): Promise<void> {
        context.enableExternal = (await context.ui.showQuickPick([
            { label: IngressConstants.external, description: IngressConstants.externalDesc, data: true },
            { label: localize('internal', 'Internal'), description: IngressConstants.internalDesc, data: false }],
            { placeHolder: localize('ingressVisibility', 'Select the HTTP traffic that the endpoint will accept.') })).data;
    }

    public shouldPrompt(context: IngressContext): boolean {
        return context.enableIngress === true && context.enableExternal === undefined;
    }
}
