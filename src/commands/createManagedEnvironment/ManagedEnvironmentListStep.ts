/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { hasMatchingPickDescription, recommendedPickDescription } from "../../utils/pickUtils";
import { type ManagedEnvironmentContext } from "../ManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export type ManagedEnvironmentListStepOptions = {
    skipIfNone?: boolean;
    skipSubWizardCreate?: boolean;
    pickUpdateStrategy?: ManagedEnvironmentPickUpdateStrategy;
};

export interface ManagedEnvironmentPickUpdateStrategy {
    updatePicks(context: Partial<ManagedEnvironmentCreateContext>, picks: IAzureQuickPickItem<ManagedEnvironment>[]): void | Promise<void>;
}

export class ManagedEnvironmentListStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options?: ManagedEnvironmentListStepOptions) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        const environmentPicks: IAzureQuickPickItem<ManagedEnvironment>[] = await this.getPicks(context);
        await this.options?.pickUpdateStrategy?.updatePicks(context, environmentPicks);

        if (!environmentPicks.length && this.options?.skipIfNone) {
            return;
        }

        const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = environmentPicks;
        picks.unshift({
            label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
            data: undefined,
        });

        const pick = await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectManagedEnvironment', 'Select a container apps environment'),
            suppressPersistence: true,
        });
        const managedEnvironment: ManagedEnvironment | undefined = pick.data;

        if (managedEnvironment) {
            await ManagedEnvironmentListStep.populateContextWithManagedEnvironment(context, managedEnvironment);
        }

        context.telemetry.properties.usedRecommendedEnv = hasMatchingPickDescription(pick, recommendedPickDescription) ? 'true' : 'false';
        context.telemetry.properties.recommendedEnvCount =
            String(picks.reduce((count, pick) => count + (hasMatchingPickDescription(pick, recommendedPickDescription) ? 1 : 0), 0));
    }

    public shouldPrompt(context: T): boolean {
        return !context.managedEnvironment && !context.newManagedEnvironmentName;
    }

    private async getPicks(context: T): Promise<IAzureQuickPickItem<ManagedEnvironment>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(
            context.resourceGroup ?
                client.managedEnvironments.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
                client.managedEnvironments.listBySubscription()
        );

        return managedEnvironments.map(env => {
            return {
                label: nonNullProp(env, 'name'),
                data: env,
            };
        });
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        if (this.options?.skipSubWizardCreate || context.managedEnvironment) {
            return undefined;
        }

        return {
            promptSteps: [
                new ManagedEnvironmentNameStep(),
            ],
            executeSteps: [
                new LogAnalyticsCreateStep(),
                new ManagedEnvironmentCreateStep(),
            ],
        };
    }

    static async getManagedEnvironments(context: ISubscriptionActionContext): Promise<ManagedEnvironment[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        return await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    }

    static async populateContextWithManagedEnvironment(context: ManagedEnvironmentContext & { resourceGroup?: ResourceGroup }, managedEnvironment: ManagedEnvironment): Promise<void> {
        if (!context.resourceGroup) {
            const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
            context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
        }
        if (!LocationListStep.hasLocation(context)) {
            await LocationListStep.setLocation(context, managedEnvironment.location);
        }
        context.managedEnvironment = managedEnvironment;
    }
}
