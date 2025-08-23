/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ContainerAppsAPIClient, type Ingress } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp, nonNullValueAndProp, type AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { containerAppsWebProvider, ImageSource } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { ContainerAppStartVerificationStep } from "../image/imageSource/ContainerAppStartVerificationStep";
import { getContainerNameForImage } from "../image/imageSource/containerRegistry/getContainerNameForImage";
import { enabledIngressDefaults } from "../ingress/enableIngress/EnableIngressStep";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";

export class ContainerAppCreateStep<T extends ContainerAppCreateContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 620;
    public stepName: string = 'containerAppCreateStep';
    protected getOutputLogSuccess = (context: T) => localize('createContainerAppSuccess', 'Created container app "{0}".', context.newContainerAppName);
    protected getOutputLogFail = (context: T) => localize('createContainerAppFail', 'Failed to create container app "{0}"', context.newContainerAppName);
    protected getTreeItemLabel = (context: T) => localize('createContainerAppLabel', 'Create container app "{0}"', context.newContainerAppName);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('creatingContainerApp', 'Creating container app...') });

        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const resourceGroupName: string = nonNullValueAndProp(context.resourceGroup, 'name');
        const containerAppName: string = nonNullProp(context, 'newContainerAppName');

        const ingress: Ingress | undefined = context.enableIngress ? {
            ...enabledIngressDefaults,
            external: context.enableExternal,
            targetPort: context.targetPort,
        } : undefined;

        context.containerApp = ContainerAppItem.CreateContainerAppModel(await appClient.containerApps.beginCreateOrUpdateAndWait(resourceGroupName, containerAppName, {
            location: (await LocationListStep.getLocation(context, containerAppsWebProvider)).name,
            managedEnvironmentId: context.managedEnvironment?.id,
            configuration: {
                ingress,
                secrets: context.secrets,
                registries: context.registryCredentials,
                activeRevisionsMode: KnownActiveRevisionsMode.Single,
            },
            template: {
                containers: [
                    {
                        image: context.image,
                        name: getContainerNameForImage(nonNullProp(context, 'image')),
                        env: context.environmentVariables
                    }
                ]
            },
        }));
    }

    public shouldExecute(context: T): boolean {
        return !context.containerApp;
    }

    public addExecuteSteps(context: T): AzureWizardExecuteStep<T>[] {
        if (context.imageSource === ImageSource.QuickstartImage) {
            return [];
        }

        return [new ContainerAppStartVerificationStep()];
    }
}
