/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container } from "@azure/arm-appcontainers";
import { type Progress } from "vscode";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";

export class EnvironmentVariableAddDraftStep<T extends EnvironmentVariableAddContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 590;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('addingEnv', 'Adding environment variable (draft)...') });
        context.environmentVariable = {
            name: context.newEnvironmentVariableName,
            value: context.newEnvironmentVariableManualInput ?? '', // The server doesn't allow this value to be undefined
            secretRef: context.secretName,
        };

        this.revisionDraftTemplate.containers ??= [];

        const container: Container = this.revisionDraftTemplate.containers[context.containersIdx] ?? {};
        container.env ??= [];
        container.env.push(context.environmentVariable);

        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return !context.environmentVariable;
    }
}
