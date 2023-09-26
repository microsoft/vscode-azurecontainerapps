/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureWizardExecuteStep, ExecuteActivityContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { tryCatchActivityWrapper } from "../../utils/activity/activityUtils";

export interface ExecuteActivityOutput {
    /**
     * The activity child item to display on success or fail
     */
    item?: AzExtTreeItem;
    /**
     * The output log message(s) to display on success or fail
     */
    output?: string | string[];
}

export interface ExecuteActivityOutputOptions {
    shouldSwallowError?: boolean;
}

/**
 * An execute activity base step (wrapper) that automatically handles displaying activity children and/or output log messages on success or fail
 */
export abstract class ExecuteActivityOutputStepBase<T extends IActionContext & ExecuteActivityContext> extends AzureWizardExecuteStep<T> {
    abstract priority: number;
    protected options: ExecuteActivityOutputOptions = {};

    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.success = this.initSuccessOutput(context);
        this.fail = this.initFailOutput(context);

        await tryCatchActivityWrapper(() => this.executeCore(context, progress), context, this.success, this.fail, this.options);
    }

    protected abstract executeCore(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void>;
    abstract shouldExecute(context: T): boolean;

    protected abstract initSuccessOutput(context: T): ExecuteActivityOutput;
    protected abstract initFailOutput(context: T): ExecuteActivityOutput;
}
