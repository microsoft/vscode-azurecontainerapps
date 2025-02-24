/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { hasMatchingPickDescription, recommendedPickDescription } from "../../utils/pickUtils";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

export type ManagedEnvironmentPick = IAzureQuickPickItem<ManagedEnvironment | undefined>;

export interface ManagedEnvironmentRecommendedPicksStrategy<T extends Partial<ManagedEnvironmentCreateContext>> {
    setRecommendedPicks(context: T, picks: ManagedEnvironmentPick[]): void | Promise<void>;
}

export class ManagedEnvironmentListStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options?: { recommendedPicksStrategy?: ManagedEnvironmentRecommendedPicksStrategy<T> }) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = await this.getPicks(context);
        await this.options?.recommendedPicksStrategy?.setRecommendedPicks(context, picks);
        if (!picks.length) {
            return;
        }

        const pick = await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectManagedEnvironment', 'Select a container apps environment'),
            suppressPersistence: true,
        });
        const managedEnvironment: ManagedEnvironment | undefined = pick.data;

        if (managedEnvironment) {
            await this.updateContextWithManagedEnvironmentResources(context, managedEnvironment);
        }

        context.telemetry.properties.usedRecommendedEnv = hasMatchingPickDescription(pick, recommendedPickDescription) ? 'true' : 'false';
        context.telemetry.properties.recommendedEnvCount =
            String(picks.reduce((count, pick) => count + (hasMatchingPickDescription(pick, recommendedPickDescription) ? 1 : 0), 0));
    }

    public shouldPrompt(context: T): boolean {
        return !context.managedEnvironment;
    }

    private async getPicks(context: T): Promise<IAzureQuickPickItem<ManagedEnvironment | undefined>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(
            context.resourceGroup ?
                client.managedEnvironments.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
                client.managedEnvironments.listBySubscription()
        );

        return [
            ...managedEnvironments.map(env => {
                return {
                    label: nonNullProp(env, 'name'),
                    data: env
                };
            }),
            {
                label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
                data: undefined
            },
        ];
    }

    private async updateContextWithManagedEnvironmentResources(context: T, managedEnvironment: ManagedEnvironment): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
        context.managedEnvironment = managedEnvironment;
        // Todo: Set location?
    }
}
