/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { localize } from "../../../utils/localize";
import type { IngressBaseContext } from "../IngressContext";
import { IngressUpdateStepBase } from "../IngressUpdateStepBase";

export class TargetPortUpdateStep extends IngressUpdateStepBase<IngressBaseContext> {
    public priority: number = 650;

    public async execute(context: IngressBaseContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');
        const ingress = nonNullValueAndProp(containerApp.configuration, 'ingress');
        ingress.targetPort = context.targetPort;

        const working: string = localize('updatingTargetPort', 'Updating target port...');
        const workCompleted: string = localize('updatedTargetPort', 'Updated target port to {0} for container app "{1}"', context.targetPort, containerApp.name);

        await this.updateIngressSettings(context, progress, { ingress, working, workCompleted });
    }

    public shouldExecute(): boolean {
        return true;
    }
}
