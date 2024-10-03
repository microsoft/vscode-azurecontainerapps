/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, validationUtils } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";

export class EnvironmentVariableNameStep<T extends EnvironmentVariableAddContext> extends AzureWizardPromptStep<T> {
    constructor(readonly baseItem: ContainerAppItem | RevisionsItemModel) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        context.newEnvironmentVariableName = (await context.ui.showInputBox({
            prompt: localize('envNamePrompt', 'Enter a name for the environment variable'),
            validateInput: (value: string) => this.validateInput(context, value),
        })).trim();
        context.valuesToMask.push(context.newEnvironmentVariableName);
    }

    public shouldPrompt(context: T): boolean {
        return !context.newEnvironmentVariableName;
    }

    private validateInput(context: T, value: string): string | undefined {
        if (!validationUtils.hasValidCharLength(value)) {
            return validationUtils.getInvalidCharLengthMessage();
        }

        // This is the same regex used by the portal with similar warning verbiage
        const rule = /^[-._a-zA-z][-._a-zA-Z0-9]*$/;
        if (!rule.test(value)) {
            return localize('invalidEnvName', 'Name contains invalid character. Regex used for validation is "{0}".', String(rule));
        }

        const container: Container | undefined = getParentResourceFromItem(this.baseItem).template?.containers?.[context.containersIdx];
        const envs: EnvironmentVar[] = container?.env ?? [];

        if (envs.some(env => env.name === value)) {
            return localize('duplicateEnv', 'Environment variable with name "{0}" already exists for this container.', value);
        }

        return undefined;
    }
}
