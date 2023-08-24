/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Ingress } from "@azure/arm-appcontainers";
import { GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateBaseStep } from "../IngressUpdateBaseStep";

export class EnableIngressStep extends IngressUpdateBaseStep<IngressContext> {
    public priority: number = 650;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
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
                const workCompleted: string = localize('enableCompleted', 'Enabled ingress on port {0} for container app "{1}".', context.targetPort, containerApp.name)

                await this.updateIngressSettings(context, progress, { ingress, working, workCompleted });
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === true && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
    }

    private initSuccessOutput(context: IngressContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['enableIngressStep', activitySuccessContext]),
            label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
            iconPath: activitySuccessIcon
        });
    }

    private initFailOutput(context: IngressContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['enableIngressStep', activityFailContext]),
            label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('enableIngressFailed', 'Failed to enable ingress on port {0} for container app "{1}".', context.targetPort, context.containerApp?.name);
    }
}
