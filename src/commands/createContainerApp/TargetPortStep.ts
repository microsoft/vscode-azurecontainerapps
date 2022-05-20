/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IContainerAppContext } from "./IContainerAppContext";

export class TargetPortStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        context.targetPort = Number(await context.ui.showInputBox({
            prompt: localize('targetPort', 'This is the port your container is listening on that will receive traffic. Set this value to the port number that your container uses.'),
            value: String(context.defaultPort ?? 80),
            validateInput: this.validateInput
        }));
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.targetPort;
    }

    private validateInput(val: string): string | undefined {
        const num = Number(val);
        if (isNaN(num)) {
            return localize('enterNumber', 'Enter a valid port number')
        } else if (!Number.isInteger(val)) {
            return localize('integersOnly', 'Enter only whole integer values');
        } else if (num < 1 || num > 65535) {
            return localize('portRange', 'Enter a number between 1-65535');
        }

        return undefined;
    }
}
