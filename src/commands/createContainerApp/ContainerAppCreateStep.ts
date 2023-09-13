/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Ingress, KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { containerAppsWebProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { getContainerNameForImage } from "../deployImage/imageSource/containerRegistry/getContainerNameForImage";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";

export class ContainerAppCreateStep extends AzureWizardExecuteStep<ICreateContainerAppContext> {
    public priority: number = 750;

    public async execute(context: ICreateContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        const ingress: Ingress | undefined = context.enableIngress ? {
            targetPort: context.targetPort,
            external: context.enableExternal,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    weight: 100,
                    latestRevision: true
                }
            ],
        } : undefined;

        const creating: string = localize('creatingContainerApp', 'Creating new container app "{0}"...', context.newContainerAppName);
        progress.report({ message: creating });
        ext.outputChannel.appendLog(creating);

        context.containerApp = ContainerAppItem.CreateContainerAppModel(await appClient.containerApps.beginCreateOrUpdateAndWait(nonNullProp(context, 'newResourceGroupName'), nonNullProp(context, 'newContainerAppName'), {
            location: (await LocationListStep.getLocation(context, containerAppsWebProvider)).name,
            managedEnvironmentId: context.managedEnvironmentId,
            configuration: {
                ingress,
                secrets: context.secrets,
                registries: context.registries,
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
            }
        }));
    }

    public shouldExecute(): boolean {
        return true;
    }
}
