/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, IActionContext } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { localize } from "../../utils/localize";
import { IDeleteManagedEnvironmentWizardContext } from "./IDeleteManagedEnvironmentWizardContext";

export class DeleteContainerAppChildrenStep extends AzureWizardExecuteStep<IDeleteManagedEnvironmentWizardContext> {
    public priority: number = 100;

    public async execute(context: IDeleteManagedEnvironmentWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const deleting: string = localize('deletingContainerAppChildren', 'Deleting {0} Container App children', context.containerApps.length);
        progress.report({ message: deleting });

        const deletePromises = context.containerApps.map(c => c.deleteTreeItem({...context, suppressPrompt: true } as IActionContext));
        await Promise.all(deletePromises);
    }

    public shouldExecute(context: IDeleteManagedEnvironmentWizardContext): boolean {
        return context.containerApps.length ? true : false;
    }
}
