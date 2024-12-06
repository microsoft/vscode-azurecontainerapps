/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { SecretListStep } from "../../secret/SecretListStep";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";
import { EnvironmentVariableManualInputStep } from "./EnvironmentVariableManualInputStep";

export enum EnvironmentVariableType {
    ManualInput = 'manual',
    SecretRef = 'secretRef',
}

export class EnvironmentVariableTypeListStep<T extends EnvironmentVariableAddContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        const placeHolder: string = localize('environmentVariableTypePrompt', 'Select an environment variable type');
        const picks: IAzureQuickPickItem<EnvironmentVariableType>[] = [
            {
                label: localize('manualLabel', 'Manual entry'),
                data: EnvironmentVariableType.ManualInput,
            },
            {
                label: localize('secretRefLabel', 'Reference a secret'),
                data: EnvironmentVariableType.SecretRef,
            },
        ];
        context.newEnvironmentVariableType = (await context.ui.showQuickPick(picks, {
            placeHolder,
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: T): boolean {
        return !context.newEnvironmentVariableType;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        const promptSteps: AzureWizardPromptStep<T>[] = [];

        switch (context.newEnvironmentVariableType) {
            case EnvironmentVariableType.ManualInput:
                promptSteps.push(new EnvironmentVariableManualInputStep());
                break;
            case EnvironmentVariableType.SecretRef:
                promptSteps.push(new SecretListStep({ suppressCreatePick: true }));
                break;
            default:
        }

        return { promptSteps };
    }
}
