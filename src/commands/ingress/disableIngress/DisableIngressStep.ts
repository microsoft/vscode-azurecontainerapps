/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActivityChildItem, ActivityChildType, activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, createContextValue, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { localize } from "../../../utils/localize";
import { type IngressBaseContext } from "../IngressContext";
import { IngressUpdateStepBase } from "../IngressUpdateStepBase";
import { isIngressEnabled } from "../isIngressEnabled";

const disableIngressStepContext: string = 'disableIngressStepItem';

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

    public createSuccessOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name),
                contextValue: createContextValue([disableIngressStepContext, activitySuccessContext]),
                activityType: ActivityChildType.Success,
                iconPath: activitySuccessIcon
            }),
            message: localize('disableSuccessMessage', 'Disabled ingress for container app "{0}".', context.containerApp?.name)
        };
    }

    public createProgressOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name),
                contextValue: createContextValue([disableIngressStepContext, activityProgressContext]),
                activityType: ActivityChildType.Progress,
                iconPath: activityProgressIcon
            }),
        };
    }

    public createFailOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name),
                contextValue: createContextValue([disableIngressStepContext, activityFailContext]),
                activityType: ActivityChildType.Fail,
                iconPath: activityFailIcon,
            }),
            message: localize('disableFailMessage', 'Failed to disable ingress for container app "{0}".', context.containerApp?.name)
        };
    }
}
