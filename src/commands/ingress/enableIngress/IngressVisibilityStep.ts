/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type ConfirmationViewProperty } from "@microsoft/vscode-azext-utils";
import { IngressConstants } from "../../../constants";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../IngressContext";

export class IngressVisibilityStep<T extends IngressContext> extends AzureWizardPromptStep<T> {
    public async configureBeforePrompt(context: T): Promise<void> {
        context.telemetry.properties.enableExternal = context.enableExternal ? 'true' : 'false';
    }

    public async prompt(context: T): Promise<void> {
        context.enableExternal = (await context.ui.showQuickPick([
            { label: IngressConstants.external, description: IngressConstants.externalDesc, data: true },
            { label: localize('internal', 'Internal'), description: IngressConstants.internalDesc, data: false }],
            { placeHolder: localize('ingressVisibility', 'Select the HTTP traffic that the endpoint will accept.') })).data;
        context.telemetry.properties.enableExternal = context.enableExternal ? 'true' : 'false';
    }

    public shouldPrompt(context: T): boolean {
        return context.enableIngress === true && context.enableExternal === undefined;
    }

    public confirmationViewProperty(context: T): ConfirmationViewProperty {
        return {
            name: localize('ingressVisibility', 'Ingress Visibility'),
            value: context.enableExternal ? 'External' : 'Internal',
            contextPropertyName: 'enableExternal'
        };
    }
}
