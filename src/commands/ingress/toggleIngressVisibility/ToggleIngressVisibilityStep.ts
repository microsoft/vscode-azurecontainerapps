/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { IngressConstants } from "../../../constants";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateBaseStep } from "../IngressUpdateBaseStep";

export class ToggleIngressVisibilityStep extends IngressUpdateBaseStep<IngressContext> {
    public priority: number = 300;

    public async execute(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');
        const ingress = nonNullValueAndProp(containerApp.configuration, 'ingress');

        const warningPrompt = localize('visibilityWarning', 'This will change the ingress visibility from "{0}" to "{1}".', ingress.external ? IngressConstants.external : IngressConstants.internal, !ingress.external ? IngressConstants.external : IngressConstants.internal)
        await context.ui.showWarningMessage(warningPrompt, { modal: true }, { title: localize('continue', 'Continue') });
        ingress.external = !ingress.external;

        const working: string = localize('updatingVisibility', 'Updating ingress visibility...');
        const workCompleted: string = localize('updatedVisibility', 'Updated container app "{0}" ingress visibility to "{1}"', containerApp.name, ingress.external ? IngressConstants.external : IngressConstants.internal);

        await this.updateIngressSettings(context, progress, { ingress, working, workCompleted });
    }

    public shouldExecute(): boolean {
        return true;
    }
}
