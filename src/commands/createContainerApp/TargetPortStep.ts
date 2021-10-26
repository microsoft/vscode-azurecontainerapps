/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { IContainerAppContext } from "./IContainerAppContext";

export class TargetPortStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        context.targetPort = Number(await context.ui.showInputBox({
            prompt: localize('targetPort', 'This is the port your container is listening on that will receive traffic. Set this value to the port number that your container uses.'),
            value: '80',
            validateInput: val => isNaN(Number(val)) ? localize('enterNumber', 'Enter a valid port number') : undefined
        }));
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.targetPort;
    }
}
