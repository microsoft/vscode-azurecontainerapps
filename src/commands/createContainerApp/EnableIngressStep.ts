/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, DialogResponses } from "vscode-azureextensionui";
import { localize } from "../../utils/localize";
import { IContainerAppContext } from "./IContainerAppContext";

export class EnableIngressStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        context.enableIngress = (await context.ui.showQuickPick([{ label: DialogResponses.yes.title, data: true }, { label: DialogResponses.no.title, data: false }],
            { placeHolder: localize('enableIngress', 'Enable ingress? When ingress is enabled, your application will be assigned a fully-qualified domain name.') })).data;

    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.enableIngress;
    }
}
