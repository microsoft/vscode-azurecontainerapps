/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp/updateContainerApp";
import { UpdateImageContext } from "./updateImage";

export class UpdateRegistryAndSecretsStep extends AzureWizardExecuteStep<UpdateImageContext> {
    public priority: number = 480;

    public async execute(context: UpdateImageContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        // If the credentials have not changed, we can skip this update
        if (
            this.areSecretsDeepEqual(containerAppEnvelope.configuration.secrets, context.secrets) &&
            this.areRegistriesDeepEqual(containerAppEnvelope.configuration.registries, context.registries)
        ) {
            return;
        }

        progress.report({ message: localize('configuringSecrets', 'Configuring registry secrets...') });

        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registries;

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        ext.outputChannel.appendLog(localize('updatedSecrets', 'Updated container app "{0}" with new registry secrets.', containerApp.name));
    }

    public shouldExecute(context: UpdateImageContext): boolean {
        return !!context.registries && !!context.secrets;
    }

    private areSecretsDeepEqual(originalSecrets: Secret[] | undefined, newSecrets: Secret[] | undefined): boolean {
        originalSecrets?.sort((a, b) => sortAlphabeticallyByKey(a, b, 'name'));
        newSecrets?.sort((a, b) => sortAlphabeticallyByKey(a, b, 'name'));
        return deepEqual(originalSecrets, newSecrets);
    }

    private areRegistriesDeepEqual(originalRegistries: RegistryCredentials[] | undefined, newRegistries: RegistryCredentials[] | undefined): boolean {
        originalRegistries?.sort((a, b) => sortAlphabeticallyByKey(a, b, 'passwordSecretRef'));
        newRegistries?.sort((a, b) => sortAlphabeticallyByKey(a, b, 'passwordSecretRef'));
        return deepEqual(originalRegistries, newRegistries);
    }
}

function sortAlphabeticallyByKey<T extends Secret | RegistryCredentials>(a: T, b: T, key: keyof T): number {
    const valOne = nonNullProp(a, key) as string;
    const valTwo = nonNullProp(b, key) as string;
    return valOne.localeCompare(valTwo);
}
