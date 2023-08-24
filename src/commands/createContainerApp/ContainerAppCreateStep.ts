/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Ingress, KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, containerAppsWebProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../utils/activityUtils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { getContainerNameForImage } from "../deployImage/imageSource/containerRegistry/getContainerNameForImage";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";

export class ContainerAppCreateStep extends AzureWizardExecuteStep<ICreateContainerAppContext> {
    public priority: number = 750;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: ICreateContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
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
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(): boolean {
        return true;
    }

    private initSuccessOutput(context: ICreateContainerAppContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['containerAppCreateStep', activitySuccessContext]),
            label: localize('createContainerApp', 'Create container app "{0}"', context.newContainerAppName),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('createContainerAppSuccess', 'Created container app "{0}".', context.newContainerAppName);
    }

    private initFailOutput(context: ICreateContainerAppContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['containerAppCreateStep', activityFailContext]),
            label: localize('createContainerApp', 'Create container app "{0}"', context.newContainerAppName),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('createContainerAppFail', 'Failed to create container app "{0}".', context.newContainerAppName);
    }
}
