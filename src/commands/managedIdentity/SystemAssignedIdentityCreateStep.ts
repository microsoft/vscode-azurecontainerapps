/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp } from "@azure/arm-appcontainers";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { type IContainerAppContext } from "../IContainerAppContext";
import { updateContainerApp } from "../updateContainerApp";

const systemAssignedIdentityType: string = 'SystemAssigned';

export class SystemAssignedIdentityCreateStep extends ExecuteActivityOutputStepBase<IContainerAppContext> {
    public priority: number = 630;

    protected async executeCore(context: IContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerApp = nonNullProp(context, 'containerApp');
        progress.report({ message: localize('enablingIdentity', 'Enabling managed identity...') })

        context.containerApp = await updateContainerApp(context, context.subscription, containerApp, {
            identity: {
                type: systemAssignedIdentityType,
            }
        });
    }

    public shouldExecute(context: IContainerAppContext): boolean {
        return !!context.containerApp && context.containerApp.identity?.type !== systemAssignedIdentityType;
    }

    protected createSuccessOutput(context: IContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['systemAssignedIdentityCreateStepSuccessItem', activitySuccessContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for container app "{0}"', context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('systemAssignedIdentitySuccess', 'Successfully enabled system-assigned managed identity for container app "{0}".', context.containerApp?.name)
        };
    }

    protected createFailOutput(context: IContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['systemAssignedIdentityCreateStepFailItem', activityFailContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for container app "{0}"', context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('systemAssignedIdentityFail', 'Failed to enable system-assigned managed identity for container app "{0}".', context.containerApp?.name)
        };
    }
}
