/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Ingress } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateStepBase } from "../IngressUpdateStepBase";

export class EnableIngressStep extends IngressUpdateStepBase<IngressContext> {
    public priority: number = 750;

    public async execute(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');
        const ingress: Ingress = {
            targetPort: context.targetPort,
            external: context.enableExternal,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    weight: 100,
                    latestRevision: true
                }
            ],
        }

        const working: string = localize('enablingIngress', 'Enabling ingress...');
        const workCompleted: string = localize('enableCompleted', 'Enabled ingress on port {0} for container app "{1}"', context.targetPort, containerApp.name)

        await this.updateIngressSettings(context, progress, { ingress, working, workCompleted });
    }

    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === true;
    }
}
