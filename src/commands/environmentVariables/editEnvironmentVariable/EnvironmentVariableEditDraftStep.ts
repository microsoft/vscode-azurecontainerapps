/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar } from "@azure/arm-appcontainers";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, GenericParentTreeItem, GenericTreeItem, nonNullValue, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { EnvironmentVariableType } from "../addEnvironmentVariable/EnvironmentVariableTypeListStep";
import { type EnvironmentVariableEditContext } from "./EnvironmentVariableEditContext";

export class EnvironmentVariableEditDraftStep<T extends EnvironmentVariableEditContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 960;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('editingEnv', 'Editing environment variable (draft)...') });
        this.revisionDraftTemplate.containers ??= [];

        const container: Container = this.revisionDraftTemplate.containers[context.containersIdx] ?? {};
        container.env ??= [];

        const environmentVariable: EnvironmentVar = nonNullValue(container.env.find(env => env.name === context.environmentVariable.name));
        environmentVariable.name = context.newEnvironmentVariableName ?? environmentVariable.name;

        switch (context.newEnvironmentVariableType) {
            case EnvironmentVariableType.ManualInput:
                environmentVariable.value = context.newEnvironmentVariableManualInput ?? '';
                environmentVariable.secretRef = undefined;
                break;
            case EnvironmentVariableType.SecretRef:
                environmentVariable.value = ''; // The server doesn't allow this value to be undefined
                environmentVariable.secretRef = context.secretName;
                break;
            default:
            // If no new environmentVariableValue, do nothing (i.e. keep the existing values the same)
        }

        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return !!context.environmentVariable;
    }

    public createSuccessOutput(): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['environmentVariableEditDraftStepSuccessItem', activitySuccessContext]),
                label: localize('editEnvironmentVariable', 'Edit environment variable (draft)'),
                iconPath: activitySuccessIcon
            }),
            message: localize('editEnvironmentVariableSuccess', 'Edited environment variable (draft)')
        };
    }

    public createFailOutput(): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['environmentVariableEditDraftStepFailItem', activityFailContext]),
                label: localize('editEnvironmentVariable', 'Edit environment variable (draft)'),
                iconPath: activityFailIcon
            }),
            message: localize('editEnvironmentVariableFail', 'Failed to edit environment variable (draft).')
        };
    }
}
