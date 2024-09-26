/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type ImageUpdateContext } from "./updateContainerImage";

export class RegistryAndSecretsUpdateStep extends AzureWizardExecuteStep<ImageUpdateContext> {
    public priority: number = 580;

    public async execute(context: ImageUpdateContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        // If the credentials have not changed, we can skip this update
        if (
            this.areSecretsDeepEqual(containerAppEnvelope.configuration.secrets, context.secrets) &&
            this.areRegistriesDeepEqual(containerAppEnvelope.configuration.registries, context.registryCredentials)
        ) {
            context.telemetry.properties.skippedRegistryCredentialUpdate = 'true';
            return;
        }
        context.telemetry.properties.skippedRegistryCredentialUpdate = 'false';

        progress.report({ message: localize('configuringSecrets', 'Configuring registry secrets...') });
        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registryCredentials;

        await updateContainerApp(context, context.subscription, containerAppEnvelope);
        ext.outputChannel.appendLog(localize('updatedSecrets', 'Updated container app "{0}" with new registry secrets.', containerApp.name));
    }

    public shouldExecute(context: ImageUpdateContext): boolean {
        return !!context.registryCredentials && !!context.secrets;
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
    if (typeof a[key] !== 'string' || typeof b[key] !== 'string') {
        return 0;
    }

    const valOne = a[key] as string;
    const valTwo = b[key] as string;
    return valOne.localeCompare(valTwo);
}
