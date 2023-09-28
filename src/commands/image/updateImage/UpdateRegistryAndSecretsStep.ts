/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp/updateContainerApp";
import { UpdateImageContext } from "./updateImage";

export class UpdateRegistryAndSecretsStep extends AzureWizardExecuteStep<UpdateImageContext> {
    public priority: number = 480;

    public async execute(context: UpdateImageContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('configuringSecrets', 'Configuring registry secrets...') });

        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registries;

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        ext.outputChannel.appendLog(localize('updatedSecrets', 'Updated container app "{0}" with new registry secrets.', containerApp.name));
    }

    public shouldExecute(context: UpdateImageContext): boolean {
        return !!context.registries && !!context.secrets;
    }
}
