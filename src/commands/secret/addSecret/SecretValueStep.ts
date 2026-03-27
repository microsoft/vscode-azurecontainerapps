/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, GoBackError, UserCancelledError } from "@microsoft/vscode-azext-utils";
import { QuickInputButtons, ThemeIcon, window, type QuickInputButton } from "vscode";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import { type ISecretContext } from "../ISecretContext";

interface UIWithWizard {
    wizard?: {
        showTitle?: boolean;
        title?: string;
        hideStepCount?: boolean;
        currentStep?: number;
        totalSteps?: number;
        showBackButton?: boolean;
    };
}

const toggleShowValueButton: QuickInputButton = {
    iconPath: new ThemeIcon('eye'),
    tooltip: localize('showValue', 'Show value'),
};

const toggleHideValueButton: QuickInputButton = {
    iconPath: new ThemeIcon('eye-closed'),
    tooltip: localize('hideValue', 'Hide value'),
};

export class SecretValueStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        context.newSecretValue = await this.promptWithToggle(context);
        context.valuesToMask.push(context.newSecretValue);
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.newSecretValue;
    }

    private async promptWithToggle(context: ISecretContext): Promise<string> {
        const disposables: { dispose(): void }[] = [];
        try {
            const inputBox = window.createInputBox();
            disposables.push(inputBox);

            // Integrate with the wizard context for title, step count, and back button.
            // The wizard property is an internal detail of IAzureUserInput not exposed in the public type.
            const wizard = (context.ui as unknown as UIWithWizard).wizard;
            if (wizard?.showTitle) {
                inputBox.title = wizard.title;
                if (!wizard.hideStepCount && wizard.title) {
                    inputBox.step = wizard.currentStep;
                    inputBox.totalSteps = wizard.totalSteps;
                }
            }

            inputBox.prompt = localize('secretValue', 'Enter a secret value.');
            inputBox.password = true;
            inputBox.ignoreFocusOut = true;

            let isPasswordHidden = true;

            const updateButtons = (): void => {
                const btns: QuickInputButton[] = [];
                if (wizard?.showBackButton) {
                    btns.push(QuickInputButtons.Back);
                }
                btns.push(isPasswordHidden ? toggleShowValueButton : toggleHideValueButton);
                inputBox.buttons = btns;
            };

            updateButtons();

            return await new Promise<string>((resolve, reject) => {
                disposables.push(
                    inputBox.onDidChangeValue(text => {
                        inputBox.validationMessage = this.validateInput(text) ?? '';
                    }),
                    inputBox.onDidAccept(() => {
                        const validationMessage = this.validateInput(inputBox.value);
                        if (!validationMessage) {
                            resolve(inputBox.value);
                        } else {
                            inputBox.validationMessage = validationMessage ?? '';
                        }
                    }),
                    inputBox.onDidTriggerButton(btn => {
                        if (btn === QuickInputButtons.Back) {
                            reject(new GoBackError());
                        } else {
                            isPasswordHidden = !isPasswordHidden;
                            inputBox.password = isPasswordHidden;
                            updateButtons();
                        }
                    }),
                    inputBox.onDidHide(() => {
                        reject(new UserCancelledError());
                    })
                );
                inputBox.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

    private validateInput(val: string | undefined): string | undefined {
        val ??= '';

        if (!validateUtils.isValidLength(val)) {
            return validateUtils.getInvalidLengthMessage();
        }

        return undefined;
    }
}
