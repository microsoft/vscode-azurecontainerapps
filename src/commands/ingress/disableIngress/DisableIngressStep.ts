/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import type { IngressContext } from "../IngressContext";
import { IngressUpdateBaseStep } from "../IngressUpdateBaseStep";
import { isIngressEnabled } from "../isIngressEnabled";

export class DisableIngressStep extends IngressUpdateBaseStep<IngressContext> {
    public priority: number = 650;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IngressContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
                const containerApp = nonNullProp(context, 'containerApp');

                const working: string = localize('disablingIngress', 'Disabling ingress...');
                const workCompleted: string = localize('disableCompleted', 'Disabled ingress for container app "{0}"', containerApp.name);

                await this.updateIngressSettings(context, progress, { ingress: null, working, workCompleted });
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IngressContext): boolean {
        return context.enableIngress === false && isIngressEnabled(context);
    }

    private initSuccessOutput(context: IngressContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['disableIngressStep', activitySuccessContext]),
            label: localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name),
            iconPath: activitySuccessIcon
        });
    }

    private initFailOutput(context: IngressContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['disableIngressStep', activityFailContext]),
            label: localize('disableIngressLabel', 'Disable ingress for container app "{0}"', context.containerApp?.name),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('disableIngressFailed', 'Failed to disable ingress for container app "{0}"', context.containerApp?.name);
    }
}
