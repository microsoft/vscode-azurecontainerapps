/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";

export class TargetPortStep extends AzureWizardPromptStep<ICreateContainerAppContext> {
    public async prompt(context: ICreateContainerAppContext): Promise<void> {
        context.targetPort = Number(await context.ui.showInputBox({
            prompt: localize('targetPort', 'This is the port your container is listening on that will receive traffic. Set this value to the port number that your container uses.'),
            value: String(context.defaultPort ?? 80),
            validateInput: this.validateInput
        }));
    }

    public shouldPrompt(context: ICreateContainerAppContext): boolean {
        return !context.targetPort;
    }

    private validateInput(val: string): string | undefined {
        const num = Number(val);
        if (isNaN(num)) {
            return localize('enterNumber', 'Enter a valid port number')
        } else if (!Number.isInteger(num)) {
            return localize('integersOnly', 'Enter only whole integer values');
        } else if (num < 1 || num > 65535) {
            return localize('portRange', 'Enter a number between 1-65535');
        }

        return undefined;
    }
}
