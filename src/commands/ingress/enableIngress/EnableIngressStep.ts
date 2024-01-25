/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from "@azure/arm-appcontainers";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type IngressBaseContext } from "../IngressContext";

export class EnableIngressStep extends ExecuteActivityOutputStepBase<IngressBaseContext> {
    public priority: number = 750;

    protected async executeCore(context: IngressBaseContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

    public shouldExecute(context: IngressBaseContext): boolean {
        return context.enableIngress === true && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
    }

    protected createSuccessOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['enableIngressStepSuccessItem', activitySuccessContext]),
                label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableCompleted', 'Enabled ingress on port {0} for container app "{1}".', context.targetPort, context.containerApp?.name)
        };
    }

    protected createFailOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['enableIngressStepFailItem', activityFailContext]),
                label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableIngressFailed', 'Failed to enable ingress on port {0} for container app "{1}".', context.targetPort, context.containerApp?.name)
        };
    }
}
