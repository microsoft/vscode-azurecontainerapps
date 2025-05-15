/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type IngressBaseContext } from "../IngressContext";
import { isIngressEnabled } from "../isIngressEnabled";

export class DisableIngressStep<T extends IngressBaseContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 750;
    public stepName: string = 'disableIngressStep';
    protected getOutputLogSuccess = (context: T) => localize('disableSucceeded', 'Successfully disabled ingress for container app "{0}".', context.containerApp?.name);
    protected getOutputLogFail = (context: T) => localize('disableFailed', 'Failed to disable ingress for container app "{0}".', context.containerApp?.name);
    protected getTreeItemLabel = (context: T) => localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name);

    public async execute(context: IngressBaseContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('disablingIngress', 'Disabling ingress...') });

        const containerApp = nonNullProp(context, 'containerApp');
        context.containerApp = await updateContainerApp(context, context.subscription, containerApp, { configuration: { ingress: undefined } });
    }

    public shouldExecute(context: IngressBaseContext): boolean {
        return context.enableIngress === false && isIngressEnabled(context);
    }
}
