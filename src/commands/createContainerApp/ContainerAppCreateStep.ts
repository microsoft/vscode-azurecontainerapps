/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Ingress, KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem, createContextValue, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";
import { Progress, ThemeColor, ThemeIcon } from "vscode";
import { activitySuccessContext, containerAppsWebProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { getContainerNameForImage } from "../deployImage/imageSource/containerRegistry/getContainerNameForImage";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";

export class ContainerAppCreateStep extends AzureWizardExecuteStep<ICreateContainerAppContext> {
    public priority: number = 750;

    public async execute(context: ICreateContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        const resourceGroupName: string = context.newResourceGroupName || nonNullValueAndProp(context.resourceGroup, 'name');
        const containerAppName: string = nonNullProp(context, 'newContainerAppName');

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

        const creating: string = localize('creatingContainerApp', 'Creating container app...');
        progress.report({ message: creating });

        context.containerApp = ContainerAppItem.CreateContainerAppModel(await appClient.containerApps.beginCreateOrUpdateAndWait(resourceGroupName, containerAppName, {
            location: (await LocationListStep.getLocation(context, containerAppsWebProvider)).name,
            managedEnvironmentId: context.managedEnvironmentId || context.managedEnvironment?.id,
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

        if (context.activityChildren) {
context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createContextValue(['containerAppCreateStep', containerAppName, activitySuccessContext, randomUUID()]),
                    label: localize('createContainerApp', 'Create container app "{0}"', containerAppName),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        }
    }

    public shouldExecute(): boolean {
        return true;
    }
}
