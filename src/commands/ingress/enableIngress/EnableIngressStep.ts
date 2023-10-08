/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Ingress } from "@azure/arm-appcontainers";
import { GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../constants";
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp/updateContainerApp";
import type { IngressContext } from "../IngressContext";

export class EnableIngressStep extends ExecuteActivityOutputStepBase<IngressContext> {
    public priority: number = 650;

    protected async executeCore(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('enablingIngress', 'Enabling ingress...') });

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

        await updateContainerApp(context, context.subscription, containerApp, { configuration: { ingress: ingress as Ingress | undefined } });
    }


    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === true && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
    }

    protected createSuccessOutput(context: IngressContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['enableIngressStep', activitySuccessContext]),
                label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableCompleted', 'Enabled ingress on port {0} for container app "{1}".', context.targetPort, context.containerApp?.name)
        };
    }

    protected createFailOutput(context: IngressContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['enableIngressStep', activityFailContext]),
                label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableIngressFailed', 'Failed to enable ingress on port {0} for container app "{1}".', context.targetPort, context.containerApp?.name)
        };
    }
}
