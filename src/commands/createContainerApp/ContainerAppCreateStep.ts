/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ContainerAppsAPIClient, type Ingress } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { containerAppsWebProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { getContainerNameForImage } from "../image/imageSource/containerRegistry/getContainerNameForImage";
import { type CreateContainerAppContext } from "./CreateContainerAppContext";

export class ContainerAppCreateStep extends ExecuteActivityOutputStepBase<CreateContainerAppContext> {
    public priority: number = 620;

    protected async executeCore(context: CreateContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        const resourceGroupName: string = nonNullValueAndProp(context.resourceGroup, 'name');
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
            managedEnvironmentId: context.managedEnvironment?.id,
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
            },
            // identity: {
            //     type: KnownManagedServiceIdentityType.SystemAssigned,
            // }
        }));
    }

    public shouldExecute(context: CreateContainerAppContext): boolean {
        return !context.containerApp;
    }

    protected createSuccessOutput(context: CreateContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppCreateStepSuccessItem', activitySuccessContext]),
                label: localize('createContainerApp', 'Create container app "{0}"', context.newContainerAppName),
                iconPath: activitySuccessIcon
            }),
            message: localize('createContainerAppSuccess', 'Created container app "{0}".', context.newContainerAppName)
        };
    }

    protected createFailOutput(context: CreateContainerAppContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppCreateStepFailItem', activityFailContext]),
                label: localize('createContainerApp', 'Create container app "{0}"', context.newContainerAppName),
                iconPath: activityFailIcon
            }),
            message: localize('createContainerAppFail', 'Failed to create container app "{0}".', context.newContainerAppName)
        };
    }
}
