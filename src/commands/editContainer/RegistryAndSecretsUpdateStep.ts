/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import deepEqual from "deep-eql";
import { type Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { updateContainerApp } from "../updateContainerApp";
import { type ContainerEditContext } from "./ContainerEditContext";

export class RegistryAndSecretsUpdateStep<T extends ContainerEditContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 580;
    public stepName: string = 'registryAndSecretsUpdateStep';
    protected getOutputLogSuccess = (context: T) => localize('updateRegistryCredentialsSuccess', 'Successfully updated new registry credentials and secrets for container app "{0}".', context.containerApp?.name);
    protected getOutputLogFail = (context: T) => localize('updateRegistryCredentialsFail', 'Failed to update new registry credentials and secrets for container app "{0}".', context.containerApp?.name);
    protected getTreeItemLabel = () => localize('updateRegistryCredentialsLabel', 'Update registry credentials and secrets');

    private skipRegistryCredentialUpdate: boolean;

    public async configureBeforeExecute(context: T): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        // If the credentials have not changed, we can skip this update
        if (
            context.secrets && context.registryCredentials &&
            this.areSecretsDeepEqual(containerAppEnvelope.configuration.secrets, context.secrets) &&
            this.areRegistriesDeepEqual(containerAppEnvelope.configuration.registries, context.registryCredentials)
        ) {
            this.skipRegistryCredentialUpdate = true;
            context.telemetry.properties.skippedRegistryCredentialUpdate = 'true';
            ext.outputChannel.appendLog(localize('skippingCredentialUpdate', 'Verified existing registry credentials are up to date.'));
        } else {
            this.skipRegistryCredentialUpdate = false;
            context.telemetry.properties.skippedRegistryCredentialUpdate = 'false';
        }
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        progress.report({ message: localize('configuringSecrets', 'Configuring registry secrets...') });
        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registryCredentials;

        await updateContainerApp(context, context.subscription, containerAppEnvelope);
        ext.outputChannel.appendLog(localize('updatedSecrets', 'Updated container app "{0}" with new registry secrets.', containerApp.name));
    }

    public shouldExecute(context: T): boolean {
        return !!context.registryCredentials && !!context.secrets && !this.skipRegistryCredentialUpdate;
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
