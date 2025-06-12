/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type ConfirmationViewProperty } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../IngressContext";
import { getDefaultPort } from "./getDefaultPort";

export class TargetPortInputStep extends AzureWizardPromptStep<IngressContext> {
    public async prompt(context: IngressContext): Promise<void> {
        context.targetPort = Number(await context.ui.showInputBox({
            prompt: localize('targetPort', 'This is the port your container is listening on that will receive traffic. Set this value to the port number that your container uses.'),
            value: String(getDefaultPort(context)),
            validateInput: this.validateInput
        }));

        context.telemetry.properties.targetPort = String(context.targetPort);
    }

    public async configureBeforePrompt(context: IngressContext): Promise<void> {
        if (context.targetPort) {
            context.telemetry.properties.targetPort = String(context.targetPort);
        }
    }

    public shouldPrompt(context: IngressContext): boolean {
        return !context.targetPort;
    }

    public confirmationViewProperty(context: IngressContext): ConfirmationViewProperty {
        return {
            name: localize('targetPort', 'Target Port'),
            value: String(context.targetPort),
            contextPropertyName: 'targetPort'
        };
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
