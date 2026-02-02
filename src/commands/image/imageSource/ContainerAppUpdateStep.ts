/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp, type AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import retry from "p-retry";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../../ingress/IngressContext";
import { enabledIngressDefaults } from "../../ingress/enableIngress/EnableIngressStep";
import { RegistryCredentialType } from "../../registryCredentials/RegistryCredentialsAddConfigurationListStep";
import { updateContainerApp } from "../../updateContainerApp";
import { ContainerAppStartVerificationStep } from "./ContainerAppStartVerificationStep";
import { type ImageSourceContext } from "./ImageSourceContext";
import { getContainerNameForImage } from "./containerRegistry/getContainerNameForImage";

export class ContainerAppUpdateStep<T extends ImageSourceContext & IngressContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 680;
    public stepName: string = 'containerAppUpdateStep';
    protected getOutputLogSuccess = (context: T): string => localize('updateContainerAppSuccess', 'Updated container app "{0}".', context.containerApp?.name);
    protected getOutputLogFail = (context: T): string => localize('updateContainerAppFail', 'Failed to update container app "{0}".', context.containerApp?.name);
    protected getTreeItemLabel = (context: T): string => localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('updatingContainerApp', 'Updating container app...') });

        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        let ingress: Ingress | undefined;
        if (context.enableIngress) {
            ingress = {
                ...enabledIngressDefaults,
                ...containerAppEnvelope.configuration.ingress ?? {}, // Overwrite any default settings if we already have previous configurations set
                external: context.enableExternal ?? containerAppEnvelope.configuration.ingress?.external,
                targetPort: context.targetPort ?? containerAppEnvelope.configuration.ingress?.targetPort,
            };
        } else if (context.enableIngress === false) {
            ingress = undefined;
        } else {
            // If enableIngress is not set, just default to the previous settings if they exist
            ingress = containerAppEnvelope.configuration.ingress;
        }

        containerAppEnvelope.configuration.ingress = ingress;
        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registryCredentials;

        containerAppEnvelope.template = context.template ?? containerAppEnvelope.template ?? {};
        containerAppEnvelope.template.containers ||= [];

        const newContainer: Container = {
            env: context.environmentVariables,
            image: context.image,
            name: getContainerNameForImage(nonNullProp(context, 'image')),
        };
        if (context.containersIdx) {
            containerAppEnvelope.template.containers[context.containersIdx] = newContainer;
        } else {
            containerAppEnvelope.template.containers = [newContainer];
        }

        // Related: https://github.com/microsoft/vscode-azurecontainerapps/pull/805
        const retries = 4;
        await retry(
            async (): Promise<void> => {
                await ext.state.runWithTemporaryDescription(containerApp.id, localize('updating', 'Updating...'), async () => {
                    context.containerApp = await updateContainerApp(context, context.subscription, containerAppEnvelope);
                    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
                });
            },
            {
                onFailedAttempt: (err: retry.FailedAttemptError) => {
                    if (context.newRegistryCredentialType !== RegistryCredentialType.DockerLogin || !/authentication\srequired/i.test(err.message)) {
                        throw err;
                    }
                },
                retries,
                minTimeout: 2 * 1000,
            }
        );
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    public addExecuteSteps(): AzureWizardExecuteStep<T>[] {
        return [new ContainerAppStartVerificationStep()];
    }
}
