/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Ingress } from "@azure/arm-appcontainers";
import { GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon, type Progress } from "vscode";
import { activitySuccessContext } from "../../../constants";
import { createActivityChildContext } from "../../../utils/createActivityChildContext";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateBaseStep } from "../IngressUpdateBaseStep";

export class EnableIngressStep extends IngressUpdateBaseStep<IngressContext> {
    public priority: number = 650;

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
        const workCompleted: string = localize('enableCompleted', 'Enabled ingress on port {0} for container app "{1}".', context.targetPort, containerApp.name)

        await this.updateIngressSettings(context, progress, { ingress, working, workCompleted });

        if (context.activityChildren) {
            context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['enableIngressStep', activitySuccessContext]),
                    label: localize('enableIngressLabel', 'Enable ingress on port {0} for container app "{1}"', context.targetPort, context.containerApp?.name),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        }
    }

    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === true && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
    }
}
