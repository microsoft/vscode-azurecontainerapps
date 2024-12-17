/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar } from "@azure/arm-appcontainers";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type EnvironmentVariableEditContext } from "./EnvironmentVariableEditContext";

export class EnvironmentVariableEditDraftStep<T extends EnvironmentVariableEditContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 590;

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
        environmentVariable.value = context.newEnvironmentVariableManualInput ?? environmentVariable.value;
        environmentVariable.secretRef = context.secretName ?? environmentVariable.secretRef;

        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return !!context.environmentVariable;
    }
}
