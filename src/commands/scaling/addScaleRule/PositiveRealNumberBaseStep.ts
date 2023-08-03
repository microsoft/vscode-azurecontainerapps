/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { ValidNumberTypeOptions, validateUtils } from "../../../utils/validateUtils";
import type { IAddScaleRuleContext } from "./IAddScaleRuleContext";

export abstract class PositiveWholeNumberBaseStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public abstract prompt(context: IAddScaleRuleContext): Promise<void>;
    public abstract shouldPrompt(context: IAddScaleRuleContext): boolean;

    protected validateInput(value: string | undefined): string | undefined {
        value = value ? value.trim() : '';

        if (!validateUtils.hasValidCharLength(value)) {
            return validateUtils.getInvalidCharLengthMessage();
        }

        const validNumberTypeOptions: ValidNumberTypeOptions = { allowFloat: false, allowZero: false, signType: 'positive' };
        if (!validateUtils.isValidNumberType(value, validNumberTypeOptions)) {
            return validateUtils.getInvalidNumberTypeMessage(validNumberTypeOptions);
        }

        if (!validateUtils.hasValidNumberValue(value)) {
            return validateUtils.getInvalidNumberValueMessage();
        }

        return undefined;
    }
}
