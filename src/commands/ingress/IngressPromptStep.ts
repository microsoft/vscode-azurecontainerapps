/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, AzureWizardPromptStep, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IngressContext } from "./IngressContext";
import { DisableIngressStep } from "./disableIngress/DisableIngressStep";
import { TargetPortInputStep } from "./editTargetPort/TargetPortInputStep";
import { EnableIngressStep } from "./enableIngress/EnableIngressStep";
import { IngressVisibilityStep } from "./enableIngress/IngressVisibilityStep";

export class IngressPromptStep extends AzureWizardPromptStep<IngressContext> {
    public async prompt(context: IngressContext): Promise<void> {
        context.enableIngress = (await context.ui.showQuickPick([{ label: localize('enable', 'Enable'), data: true }, { label: localize('disable', 'Disable'), data: false }],
            { placeHolder: localize('enableIngress', 'Enable ingress for applications that need an HTTP endpoint.') })).data;
    }

    public shouldPrompt(context: IngressContext): boolean {
        return context.enableIngress === undefined;
    }

    public async getSubWizard(context: IngressContext): Promise<IWizardOptions<IngressContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IngressContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IngressContext>[] = [];

        if (context.enableIngress) {
            promptSteps.push(new IngressVisibilityStep(), new TargetPortInputStep());
        }

        // Execute steps for amending existing container apps; skip if not yet created
        if (context.containerApp) {
            executeSteps.push(context.enableIngress ? new EnableIngressStep() : new DisableIngressStep());
        }

        return { promptSteps, executeSteps };
    }
}
