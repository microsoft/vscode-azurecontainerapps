/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";
import { IngressVisibilityStep } from "./IngressVisibilityStep";
import { TargetPortStep } from "./TargetPortStep";

export class EnableIngressStep extends AzureWizardPromptStep<ICreateContainerAppContext> {
    public async prompt(context: ICreateContainerAppContext): Promise<void> {
        context.enableIngress = (await context.ui.showQuickPick([{ label: localize('enable', 'Enable'), data: true }, { label: localize('disable', 'Disable'), data: false }],
            { placeHolder: localize('enableIngress', 'Enable ingress for applications that need an HTTP endpoint.') })).data;

    }

    public shouldPrompt(context: ICreateContainerAppContext): boolean {
        return context.enableIngress === undefined
    }

    public async getSubWizard(context: ICreateContainerAppContext): Promise<IWizardOptions<ICreateContainerAppContext> | undefined> {
        if (context.enableIngress) {
            return {
                promptSteps: [new IngressVisibilityStep(), new TargetPortStep()]
            }
        }

        return undefined;
    }
}
