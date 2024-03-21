/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

export class TryUseExistingResourceGroupsContainerRegistryStep extends ExecuteActivityOutputStepBase<DeployWorkspaceProjectInternalContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    protected async executeCore(context: DeployWorkspaceProjectInternalContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('searchingRegistries', 'Searching for available registry...') });


    }

    public shouldExecute(context: DeployWorkspaceProjectInternalContext): boolean {
        return !!context.resourceGroup && !context.registry;
    }

    protected createSuccessOutput(context: DeployWorkspaceProjectInternalContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['tryUseExistingWorkspaceContainerRegistryStepSuccessItem', activitySuccessContext]),
                label: localize('tryUseExistingWorkspaceContainerRegistrySuccessLabel', 'Use available container registry "{0}" from configuration "{1}"', context.registry?.name),
                iconPath: activitySuccessIcon,
            }),
            message: localize('tryUseExistingWorkspaceContainerRegistrySuccess', 'Using an available container registry "{0}" from configuration "{1}".', context.registry?.name)
        };
    }

    protected createFailOutput(_: DeployWorkspaceProjectInternalContext): ExecuteActivityOutput {
        // We don't need to show the user any output if this step fails
        return {};
    }
}
