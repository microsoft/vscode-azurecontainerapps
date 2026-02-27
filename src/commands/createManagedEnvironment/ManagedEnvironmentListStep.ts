/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Workspace } from "@azure/arm-operationalinsights";
import { type ResourceGroup } from "@azure/arm-resources";
import { getResourceGroupFromId, LocationListStep, ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type AzureWizardExecuteStep, type ConfirmationViewProperty, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { logAnalyticsProvider, logAnalyticsResourceType, managedEnvironmentProvider, managedEnvironmentResourceType } from "../../constants";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { type ManagedEnvironmentContext } from "../ManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { LogAnalyticsListStep } from "./LogAnalyticsListStep";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export type ManagedEnvironmentListStepOptions = {
    /**
     * Provide a custom strategy for updating the list of managed environment picks.
     * Can be used to inject custom sorting, grouping, filtering, etc.
     */
    pickUpdateStrategy?: ManagedEnvironmentPickUpdateStrategy;
};

export type ManagedEnvironmentPick = IAzureQuickPickItem<ManagedEnvironment>;

export interface ManagedEnvironmentPickUpdateStrategy {
    updatePicks(context: ManagedEnvironmentCreateContext | Partial<ManagedEnvironmentContext>, picks: ManagedEnvironmentPick[]): ManagedEnvironmentPick[] | Promise<ManagedEnvironmentPick[]>;
}

export class ManagedEnvironmentListStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options: ManagedEnvironmentListStepOptions = {}) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        const environmentPicks: ManagedEnvironmentPick[] = await this.getPicks(context);
        const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = await this.options.pickUpdateStrategy?.updatePicks(context, environmentPicks) ?? environmentPicks;

        picks.unshift({
            label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
            data: undefined,
        });

        context.managedEnvironment = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectManagedEnvironment', 'Select a container apps environment'),
            enableGrouping: true,
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: T): boolean {
        return !context.managedEnvironment && !context.newManagedEnvironmentName;
    }

    public confirmationViewProperty(context: T): ConfirmationViewProperty {
        return {
            name: localize('containerAppEnvironment', 'Container Apps Environment'),
            value: nonNullValueAndProp(context.managedEnvironment, 'name'),
            contextPropertyName: 'managedEnvironment',
        };
    }

    private async getPicks(context: T): Promise<ManagedEnvironmentPick[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        let managedEnvironments: ManagedEnvironment[];
        if (context.resourceGroup) {
            managedEnvironments = await uiUtils.listAllIterator(client.managedEnvironments.listByResourceGroup(nonNullProp(context.resourceGroup, 'name')));
        } else if (context.newResourceGroupName) {
            managedEnvironments = [];
        } else {
            managedEnvironments = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
        }

        return managedEnvironments.map(env => {
            return {
                label: nonNullProp(env, 'name'),
                data: env,
            };
        });
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        if (context.managedEnvironment) {
            await ManagedEnvironmentListStep.populateContextWithRelatedResources(context, context.managedEnvironment);
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<T>[] = [];
        const executeSteps: AzureWizardExecuteStep<T>[] = [];

        promptSteps.push(new ManagedEnvironmentNameStep());

        LocationListStep.addProviderForFiltering(context, managedEnvironmentProvider, managedEnvironmentResourceType);
        LocationListStep.addProviderForFiltering(context, logAnalyticsProvider, logAnalyticsResourceType);

        if (!context.resourceGroup) {
            promptSteps.push(new ResourceGroupListStep());
        }

        LocationListStep.addStep(context, promptSteps);

        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep(),
        );

        return { promptSteps, executeSteps };
    }

    static async getManagedEnvironmentsBySubscription(context: ISubscriptionActionContext): Promise<ManagedEnvironment[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        return await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    }

    static async populateContextWithRelatedResources(context: ManagedEnvironmentContext & { resourceGroup?: ResourceGroup; logAnalyticsWorkspace?: Workspace }, managedEnvironment: ManagedEnvironment): Promise<void> {
        if (!context.resourceGroup) {
            const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
            context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
        }
        if (!context.logAnalyticsWorkspace) {
            const workspaces: Workspace[] = await LogAnalyticsListStep.getLogAnalyticsWorkspaces(context);
            context.logAnalyticsWorkspace = workspaces.find(w => w.customerId && w.customerId === managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId);
        }
        await LocationListStep.setAutoSelectLocation(context, managedEnvironment.location);
        context.managedEnvironment = managedEnvironment;
    }
}
