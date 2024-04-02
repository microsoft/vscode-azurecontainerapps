/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, type AzExtTreeItem, type ExecuteActivityContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../extensionVariables";

export interface ExecuteActivityOutput {
    /**
     * The activity child item to display on success or fail
     */
    item?: AzExtTreeItem;
    /**
     * The output log message(s) to display on success or fail
     */
    message?: string | string[];
}

export interface ExecuteActivityOutputOptions {
    shouldSwallowError?: boolean;
}

/**
 * An execute activity base step (wrapper) that automatically handles displaying activity children and/or output log messages on success or fail
 */
export abstract class ExecuteActivityOutputStepBase<T extends IActionContext & Partial<ExecuteActivityContext>> extends AzureWizardExecuteStep<T> {
    abstract priority: number;
    protected options: ExecuteActivityOutputOptions = {};

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        let output: ExecuteActivityOutput;
        try {
            await this.executeCore(context, progress);
            output = this.createSuccessOutput(context);
        } catch (e) {
            output = this.createFailOutput(context);

            if (!this.options.shouldSwallowError) {
                throw e;
            }
        } finally {
            output ??= {};  // This line is really just to convince the TypeScript compiler that output will be defined
            this.displayOutput(context, output);
        }
    }

    private displayOutput(context: T, output: ExecuteActivityOutput): void {
        output.item && context.activityChildren?.push(output.item);

        if (!output.message) {
            return;
        }

        output.message = Array.isArray(output.message) ? output.message : [output.message];
        for (const message of output.message) {
            ext.outputChannel.appendLog(message);
        }
    }

    protected abstract executeCore(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void>;
    abstract shouldExecute(context: T): boolean;

    protected abstract createSuccessOutput(context: T): ExecuteActivityOutput;
    protected abstract createFailOutput(context: T): ExecuteActivityOutput;
}
