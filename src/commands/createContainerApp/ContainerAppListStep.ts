/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Workspace } from "@azure/arm-operationalinsights";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValue, nonNullValueAndProp, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { ManagedEnvironmentListStep } from "../createManagedEnvironment/ManagedEnvironmentListStep";
import { type IContainerAppContext } from "../IContainerAppContext";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";

export type ContainerAppListStepOptions = {
    /**
     * If no existing container apps to choose from, skip prompt automatically and create
     */
    skipIfNone?: boolean;
    /**
     * For existing container apps, automatically add subwizard steps to update
     */
    updateIfExists?: boolean;
    /**
     * Provide a custom strategy for updating the list of container app picks.
     * Can be used to inject custom sorting, grouping, filtering, etc.
     */
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
        picks.unshift({
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
        // Create
        if (!context.containerApp) {
            return {
                promptSteps: [
                    new ContainerAppNameStep(),
                    new ImageSourceListStep(),
                    new IngressPromptStep(),
                ],
                executeSteps: [
                    new ContainerAppCreateStep(),
                ],
            };
        }

        // Update
        if (this.options.updateIfExists) {
            return {
                promptSteps: [
                    new ImageSourceListStep(),
                    new IngressPromptStep(),
                ],
                executeSteps: [
                    new ContainerAppUpdateStep(),
                ],
            };
        }

        return undefined;
    }

    static async populateContextWithContainerApp(context: IContainerAppContext & { resourceGroup?: ResourceGroup; logAnalyticsWorkspace?: Workspace; managedEnvironment?: ManagedEnvironment }, containerApp: ContainerApp): Promise<void> {
        if (!context.resourceGroup || !context.logAnalyticsWorkspace || !context.managedEnvironment) {
            await ManagedEnvironmentListStep.populateContextWithManagedEnvironment(
                context,
                context.managedEnvironment ?? nonNullValue((await ManagedEnvironmentListStep.getManagedEnvironments(context)).find(env => env.id === containerApp.managedEnvironmentId))
            );
        }
        if (!LocationListStep.hasLocation(context)) {
            await LocationListStep.setLocation(context, containerApp.location);
        }
        context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);
    }
}
