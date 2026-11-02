/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar } from "@azure/arm-appcontainers";
import { ActivityChildItem, ActivityChildType, activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, createContextValue, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { TreeItemCollapsibleState, type Progress } from "vscode";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type EnvironmentVariablesEditContext } from "./EnvironmentVariablesEditContext";

export type EnvironmentVariablesEditDraftStepOutputs = {
    treeItemLabel?: string;
    outputLogFailMessage?: string;
};

const environmentVariablesEditDraftStepContext: string = 'environmentVariablesEditDraftStepItem';

export class EnvironmentVariablesEditDraftStep<T extends EnvironmentVariablesEditContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 920;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel, readonly outputs: EnvironmentVariablesEditDraftStepOutputs = {}) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('editingEnv', 'Editing environment variables (draft)...') });
        this.revisionDraftTemplate.containers ??= [];
        const container: Container = this.revisionDraftTemplate.containers[context.containersIdx] ?? {};

        const envMap = new Map<string, EnvironmentVar>();
        // Set current environment variables
        for (const env of container.env ?? []) {
            envMap.set(nonNullProp(env, 'name'), env);
        }
        // Add new environment variables
        for (const env of context.environmentVariables ?? []) {
            envMap.set(nonNullProp(env, 'name'), env);
        }

        container.env = Array.from(envMap.values());
        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return !!context.environmentVariables;
    }

    public createSuccessOutput(): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: this.outputs.treeItemLabel ?? localize('editEnvironmentVariables', 'Edit environment variables (draft)'),
                contextValue: createContextValue([environmentVariablesEditDraftStepContext, activitySuccessContext]),
                activityType: ActivityChildType.Success,
                iconPath: activitySuccessIcon,
            }),
        };
    }

    public createProgressOutput(): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: this.outputs.treeItemLabel ?? localize('editEnvironmentVariables', 'Edit environment variables (draft)'),
                contextValue: createContextValue([environmentVariablesEditDraftStepContext, activityProgressContext]),
                activityType: ActivityChildType.Progress,
                iconPath: activityProgressIcon,
            }),
        };
    }

    public createFailOutput(): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: this.outputs.treeItemLabel ?? localize('editEnvironmentVariables', 'Edit environment variables (draft)'),
                contextValue: createContextValue([environmentVariablesEditDraftStepContext, activityFailContext]),
                initialCollapsibleState: TreeItemCollapsibleState.Expanded,
                activityType: ActivityChildType.Fail,
                iconPath: activityFailIcon,
                isParent: true,
            }),
            message: this.outputs.outputLogFailMessage ?? localize('editEnvironmentVariablesFail', 'Failed to edit environment variables (draft).'),
        };
    }
}
