/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValue, nonNullValueAndProp, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { ManagedEnvironmentListStep } from "../createManagedEnvironment/ManagedEnvironmentListStep";
import { type IContainerAppContext } from "../IContainerAppContext";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";

export type ContainerAppListStepOptions = {
    skipIfNone?: boolean;
    pickUpdateStrategy?: ContainerAppPickUpdateStrategy;
};

export interface ContainerAppPickUpdateStrategy {
    updatePicks(context: Partial<ContainerAppCreateContext>, picks: IAzureQuickPickItem<ContainerApp>[]): void | Promise<void>;
}

export class ContainerAppListStep<T extends ContainerAppCreateContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options: ContainerAppListStepOptions = {}) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        const containerAppPicks: IAzureQuickPickItem<ContainerApp>[] = await this.getPicks(context);
        await this.options.pickUpdateStrategy?.updatePicks(context, containerAppPicks);

        if (!containerAppPicks.length && this.options?.skipIfNone) {
            return;
        }

        const picks: IAzureQuickPickItem<ContainerApp | undefined>[] = containerAppPicks;
        picks.push({
            label: localize('newContainerApp', '$(plus) Create new container app'),
            data: undefined,
        });

        const containerApp: ContainerApp | undefined = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectContainerApp', 'Select a container app'),
            suppressPersistence: true,
        })).data;

        if (containerApp) {
            await ContainerAppListStep.populateContextWithContainerApp(context, containerApp);
        }
    }

    public shouldPrompt(context: T): boolean {
        return !context.containerApp && !context.newContainerAppName;
    }

    private async getPicks(context: T): Promise<IAzureQuickPickItem<ContainerApp>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        let containerApps: ContainerApp[] = await uiUtils.listAllIterator(
            context.resourceGroup ?
                client.containerApps.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
                client.containerApps.listBySubscription()
        );

        if (context.managedEnvironment) {
            containerApps = containerApps.filter(ca => ca.managedEnvironmentId === context.managedEnvironment.id);
        }

        return containerApps.map(ca => {
            return {
                label: nonNullProp(ca, 'name'),
                data: ca,
            };
        });
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        if (context.containerApp) {
            return undefined;
        }

        return {
            promptSteps: [
                new ContainerAppNameStep(),
                new ImageSourceListStep(),
                // Todo: Check if this is needed
                new IngressPromptStep(),
            ],
            executeSteps: [
                new ContainerAppCreateStep(),
            ],
        };
    }

    static async populateContextWithContainerApp(context: IContainerAppContext & { resourceGroup?: ResourceGroup; managedEnvironment?: ManagedEnvironment }, containerApp: ContainerApp): Promise<void> {
        if (!context.resourceGroup) {
            const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
            context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(containerApp, 'id')));
        }
        if (!context.managedEnvironment) {
            const managedEnvironments: ManagedEnvironment[] = await ManagedEnvironmentListStep.getManagedEnvironments(context);
            context.managedEnvironment = nonNullValue(managedEnvironments.find(env => env.id === containerApp.managedEnvironmentId));
        }
        if (!LocationListStep.hasLocation(context)) {
            await LocationListStep.setLocation(context, containerApp.location);
        }
        context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);
    }
}
