/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateBaseStep } from "../IngressUpdateBaseStep";
import { isIngressEnabled } from "../isIngressEnabled";

export class DisableIngressStep extends IngressUpdateBaseStep<IngressContext> {
    public priority: number = 650;

    public async execute(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');

        const working: string = localize('disablingIngress', 'Disabling ingress...');
        const workCompleted: string = localize('disableCompleted', 'Disabled ingress for container app "{0}"', containerApp.name)

        await this.updateIngressSettings(context, progress, { ingress: null, working, workCompleted });
    }

    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === false && isIngressEnabled(context);
    }
}
