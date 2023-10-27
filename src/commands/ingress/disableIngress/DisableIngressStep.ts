/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { localize } from "../../../utils/localize";
import type { IngressBaseContext } from "../IngressContext";
import { IngressUpdateStepBase } from "../IngressUpdateStepBase";
import { isIngressEnabled } from "../isIngressEnabled";

export class DisableIngressStep extends IngressUpdateStepBase<IngressBaseContext> {
    public priority: number = 750;

    public async execute(context: IngressBaseContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');

        const working: string = localize('disablingIngress', 'Disabling ingress...');
        const workCompleted: string = localize('disableCompleted', 'Disabled ingress for container app "{0}"', containerApp.name)

        await this.updateIngressSettings(context, progress, { ingress: null, working, workCompleted });
    }

    public shouldExecute(context: IngressBaseContext): boolean {
        return context.enableIngress === false && isIngressEnabled(context);
    }
}
