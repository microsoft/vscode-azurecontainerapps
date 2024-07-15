/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { type IContainerAppContext } from "../IContainerAppContext";

export class ContainerRegistryRbacEnableStep extends ExecuteActivityOutputStepBase<IContainerAppContext> {
    public priority: number = 640; // Todo: Verify priority

    protected async executeCore(_: IContainerAppContext, __: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Todo...
    }

    public shouldExecute(_: IContainerAppContext): boolean {
        // Todo...
    }

    // Todo....
    protected createSuccessOutput(context: IContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryRbacEnableStepSuccessItem', activitySuccessContext]),
                label: localize('enable', 'Enable system-assigned identity for container app "{0}"', context.containerApp?.name),
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
