/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ContainerAppsAPIClient, type Ingress } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { containerAppsWebProvider, quickStartImageName } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { getContainerNameForImage } from "../image/imageSource/containerRegistry/getContainerNameForImage";
import { type CreateContainerAppContext } from "./CreateContainerAppContext";

const quickStart = {
    image: quickStartImageName,
    enableIngress: true,
    enableExternal: true,
    targetPort: 80,
}

/**
 * Initialize an empty container app which holds the Microsoft quick start image.
 * An empty container app is used as a precursor step for securely configuring connection to a container registry.
 */
export class EmptyContainerAppCreateStep extends ExecuteActivityOutputStepBase<CreateContainerAppContext> {
    public priority: number = 300;

    protected async executeCore(context: CreateContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const resourceGroupName: string = nonNullValueAndProp(context.resourceGroup, 'name');
        const containerAppName: string = nonNullProp(context, 'newContainerAppName');

        const ingress: Ingress | undefined = quickStart.enableIngress ? {
            targetPort: quickStart.targetPort,
            external: quickStart.enableExternal,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    weight: 100,
                    latestRevision: true
                }
            ],
        } : undefined;

        const creating: string = localize('initializingEmptyContainerApp', 'Initializing empty container app...');
        progress.report({ message: creating });

        context.containerApp = ContainerAppItem.CreateContainerAppModel(await client.containerApps.beginCreateOrUpdateAndWait(resourceGroupName, containerAppName, {
            location: (await LocationListStep.getLocation(context, containerAppsWebProvider)).name,
            managedEnvironmentId: context.managedEnvironmentId || context.managedEnvironment?.id,
            configuration: {
                ingress,
                activeRevisionsMode: KnownActiveRevisionsMode.Single,
            },
            template: {
                containers: [
                    {
                        image: quickStart.image,
                        name: getContainerNameForImage(quickStart.image),
                    }
                ]
            },
            identity: {
                type: 'SystemAssigned',
            },
        }));
    }

    public shouldExecute(context: CreateContainerAppContext): boolean {
        return !context.containerApp;
    }

    protected createSuccessOutput(context: CreateContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['emptyContainerAppCreateStepSuccessItem', activitySuccessContext]),
                label: localize('initializeEmptyContainerApp', 'Initialize empty container app "{0}"', context.newContainerAppName),
                iconPath: activitySuccessIcon
            }),
            message: localize('initializeEmptyContainerAppSuccess', 'Initialized empty container app "{0}".', context.newContainerAppName)
        };
    }

    protected createFailOutput(context: CreateContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['emptyContainerAppCreateStepFailItem', activityFailContext]),
                label: localize('initializeEmptyContainerApp', 'Initialize empty container app "{0}"', context.newContainerAppName),
                iconPath: activityFailIcon
            }),
            message: localize('initializeEmptyContainerAppFail', 'Failed to initialize empty container app "{0}".', context.newContainerAppName)
        };
    }
}
