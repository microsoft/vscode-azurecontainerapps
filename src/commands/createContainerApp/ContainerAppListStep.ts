/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
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
            context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);
        }
    }

    public shouldPrompt(context: T): boolean {
        return !context.containerApp && !context.newContainerAppName;
    }

    private async getPicks(context: T): Promise<IAzureQuickPickItem<ContainerApp>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        let containerApps: ContainerApp[] = [];
        if (context.resourceGroup) {
            containerApps = await uiUtils.listAllIterator(client.containerApps.listByResourceGroup(nonNullProp(context.resourceGroup, 'name')));
        } else if (context.newResourceGroupName) {
            containerApps = [];
        } else {
            containerApps = await uiUtils.listAllIterator(client.containerApps.listBySubscription());
        }

        if (context.managedEnvironment) {
            containerApps = containerApps.filter(ca => ca.managedEnvironmentId === context.managedEnvironment.id);
        }

        return containerApps.map(ca => {
            return {
                label: nonNullProp(ca, 'name'),
                description: parseAzureResourceId(nonNullProp(ca, 'id')).resourceGroup,
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
}
