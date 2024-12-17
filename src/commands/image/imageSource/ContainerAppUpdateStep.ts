/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../../ingress/IngressContext";
import { enabledIngressDefaults } from "../../ingress/enableIngress/EnableIngressStep";
import { updateContainerApp } from "../../updateContainerApp";
import { type ImageSourceContext } from "./ImageSourceContext";
import { getContainerNameForImage } from "./containerRegistry/getContainerNameForImage";

export class ContainerAppUpdateStep<T extends ImageSourceContext & IngressContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 680;

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

        // We want to replace the old image
        containerAppEnvelope.template ||= {};
        containerAppEnvelope.template.containers = [];

        containerAppEnvelope.template.containers.push({
            env: context.environmentVariables,
            image: context.image,
            name: getContainerNameForImage(nonNullProp(context, 'image')),
        });

        const updating = localize('updatingContainerApp', 'Updating container app...', containerApp.name);
        progress.report({ message: updating });

        await ext.state.runWithTemporaryDescription(containerApp.id, localize('updating', 'Updating...'), async () => {
            context.containerApp = await updateContainerApp(context, context.subscription, containerAppEnvelope);
            ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
        });
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerAppUpdateStepSuccessItem', activitySuccessContext]),
                label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('updateContainerAppSuccess', 'Updated container app "{0}".', context.containerApp?.name)
        };
    }

    public createFailOutput(context: T): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerAppUpdateStepFailItem', activityFailContext]),
                label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('updateContainerAppFail', 'Failed to update container app "{0}".', context.containerApp?.name)
        };
    }
}
