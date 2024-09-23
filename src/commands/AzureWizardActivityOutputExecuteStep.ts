/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, AzureWizardExecuteStep, createUniversallyUniqueContextValue, GenericParentTreeItem, GenericTreeItem, nonNullValue, type ExecuteActivityOutput, type IActionContext } from "@microsoft/vscode-azext-utils";

interface ActivityOutputCreateOptions {
    stepName: string;
    treeItemLabel: string;
    outputLogMessage?: string;
    activityStatus: 'Success' | 'Fail' | 'Progress';
}

export abstract class AzureWizardActivityOutputExecuteStep<T extends IActionContext> extends AzureWizardExecuteStep<T> {
    abstract stepName: string;
    protected abstract getSuccessString(context: T): string;
    protected abstract getFailString(context: T): string;

    protected getProgressString?(context: T): string;
    /**
     * Optional; define this if you want a special, custom label to be assigned to each tree item
     * that is different than the required success or fail strings
     */
    protected getTreeItemLabelString?(context: T): string;

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        const success: string = this.getSuccessString(context);

        return createExecuteActivityOutput(context, {
            activityStatus: 'Success',
            stepName: this.stepName,
            treeItemLabel: this.getTreeItemLabelString ? this.getTreeItemLabelString(context) : success,
            outputLogMessage: success,
        });
    }

    public createProgressOutput(context: T): ExecuteActivityOutput {
        const progress: string | undefined = this.getProgressString?.(context);

        return createExecuteActivityOutput(context, {
            activityStatus: 'Progress',
            stepName: this.stepName,
            treeItemLabel: this.getTreeItemLabelString ? this.getTreeItemLabelString(context) : nonNullValue(progress),
            outputLogMessage: progress,
        });
    }

    public createFailOutput(context: T): ExecuteActivityOutput {
        const fail: string = this.getFailString(context);

        return createExecuteActivityOutput(context, {
            activityStatus: 'Fail',
            stepName: this.stepName,
            treeItemLabel: this.getTreeItemLabelString ? this.getTreeItemLabelString(context) : fail,
            outputLogMessage: fail,
        });
    }
}

function createExecuteActivityOutput(_: IActionContext, options: ActivityOutputCreateOptions): ExecuteActivityOutput {
    const activityContext = options.activityStatus === 'Success' ? activitySuccessContext : options.activityStatus === 'Fail' ? activityFailContext : activityProgressContext;
    const contextValue = createUniversallyUniqueContextValue([`${options.stepName}${options.activityStatus}Item`, activityContext]);
    const label = options.treeItemLabel;
    const iconPath = options.activityStatus === 'Success' ? activitySuccessIcon : options.activityStatus === 'Fail' ? activityFailIcon : activityProgressIcon;

    const item = options.activityStatus === 'Fail' ?
        // Logic is in place to automatically attach an error item as child if thrown during a registered execute step -- therefore, return fails with a parent tree item
        new GenericParentTreeItem(undefined, {
            contextValue,
            label,
            iconPath
        }) :
        new GenericTreeItem(undefined, {
            contextValue,
            label,
            iconPath
        });

    return {
        item,
        message: options.outputLogMessage,
    }
}
