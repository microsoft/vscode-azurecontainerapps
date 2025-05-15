/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, validationUtils } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { type EnvironmentVariablesItem } from "../../../tree/containers/EnvironmentVariablesItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";

export class EnvironmentVariableNameStep<T extends EnvironmentVariableAddContext> extends AzureWizardPromptStep<T> {
    constructor(readonly baseItem: EnvironmentVariableItem | EnvironmentVariablesItem) {
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

        const rule = /^[-._a-zA-z][-._a-zA-Z0-9]*$/;
        if (!rule.test(value)) {
            return localize('invalidEnvName', 'The name may contain letters, numbers, periods, underscores, or hyphens. The name may not start with a number.');
        }

        // Check for duplicates
        let container: Container | undefined;
        if (ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this.baseItem)) {
            container = ext.revisionDraftFileSystem.parseRevisionDraft(this.baseItem)?.containers?.[context.containersIdx];
        } else {
            container = getParentResourceFromItem(this.baseItem).template?.containers?.[context.containersIdx];
        }

        const envs: EnvironmentVar[] = container?.env ?? [];
        if (envs.some(env => env.name === value)) {
            return localize('duplicateEnv', 'Environment variable with name "{0}" already exists for this container.', value);
        }

        return undefined;
    }
}
