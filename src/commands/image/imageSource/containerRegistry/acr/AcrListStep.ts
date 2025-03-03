/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { noMatchingResources, noMatchingResourcesQp } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { localize } from "../../../../../utils/localize";
import { type ContainerAppCreateBaseContext } from "../../../../createContainerApp/ContainerAppCreateContext";
import { type ManagedEnvironmentCreateContext } from "../../../../createManagedEnvironment/ManagedEnvironmentCreateContext";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { AcrResourceGroupAndDeployedPickUpdateStrategy } from "./AcrResourceGroupAndDeployedPickUpdateStrategy";
import { type CreateAcrContext } from "./createAcr/CreateAcrContext";
import { RegistryCreateStep } from "./createAcr/RegistryCreateStep";
import { RegistryNameStep } from "./createAcr/RegistryNameStep";
import { SkuListStep } from "./createAcr/SkuListStep";

export interface AcrListStepOptions {
    skipSubWizardCreate?: boolean;
    suppressCreatePick?: boolean;
    pickUpdateStrategy?: AcrPickUpdateStrategy;
}

export type AcrPickItem = IAzureQuickPickItem<Registry>;

export interface AcrPickUpdateStrategy {
    updatePicks(context: ContainerRegistryImageSourceContext, picks: AcrPickItem[]): AcrPickItem[] | Promise<AcrPickItem[]>;
}

const acrCreatePick = {
    label: localize('newContainerRegistry', '$(plus) Create new container registry'),
    data: undefined,
};

export class AcrListStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options: AcrListStepOptions = {}) {
        super();
        this.options.pickUpdateStrategy ??= new AcrResourceGroupAndDeployedPickUpdateStrategy();
    }

    public async prompt(context: T): Promise<void> {
        let pick: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>;
        let result: Registry | typeof noMatchingResources | undefined;
        do {
            const picks: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[] = await this.getPicks(context);
            if (picks.length === 1 && picks[0] === acrCreatePick) {
                pick = acrCreatePick;
                result = pick.data as typeof acrCreatePick['data'];
                break;
            }

            pick = await context.ui.showQuickPick(picks, {
                placeHolder: localize('selectRegistry', 'Select a container registry'),
                enableGrouping: true,
                suppressPersistence: true,
            });
            result = pick.data;
        } while (result === noMatchingResources);

        context.registry = result;
    }

    public shouldPrompt(context: T): boolean {
        return !context.registry && !context.newRegistryName;
    }

    private async getPicks(context: T): Promise<IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[]> {
        const registryPicks: AcrPickItem[] = (await AcrListStep.getRegistries(context)).map(r => {
            return {
                label: nonNullProp(r, 'name'),
                data: r,
            };
        });

        const picks: IAzureQuickPickItem<Registry | undefined>[] = await this.options.pickUpdateStrategy?.updatePicks(context, registryPicks) ?? [];
        if (!this.options?.suppressCreatePick) {
            picks.unshift(acrCreatePick);
        }
        if (!picks.length) {
            return [noMatchingResourcesQp];
        }

        return picks;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        if (this.options.skipSubWizardCreate || context.registry) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<T>[] = [
            new RegistryNameStep(),
            new SkuListStep(),
        ];
        const executeSteps: AzureWizardExecuteStep<T>[] = [
            new RegistryCreateStep(),
        ];

        await tryConfigureResourceGroupForRegistry(context, promptSteps);

        if (!LocationListStep.hasLocation(context) && context.resourceGroup) {
            await LocationListStep.setLocation(context, context.resourceGroup.location);
        } else {
            LocationListStep.addStep(context, promptSteps);
        }

        return {
            promptSteps,
            executeSteps,
        };
    }

    public static async getRegistries(context: ISubscriptionActionContext): Promise<Registry[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        return await uiUtils.listAllIterator(client.registries.list());
    }
}

async function tryConfigureResourceGroupForRegistry(
    context: ContainerRegistryImageSourceContext,
    promptSteps: AzureWizardPromptStep<ContainerRegistryImageSourceContext>[],
): Promise<void> {
    // No need to pollute the base context with all the potential pre-create typings as they are not otherwise used
    const resourceCreationContext = context as Partial<ContainerAppCreateBaseContext> & Partial<ManagedEnvironmentCreateContext> & CreateAcrContext;
    if (resourceCreationContext.resourceGroup || resourceCreationContext.newResourceGroupName) {
        return;
    }

    // Try to check for an existing container app or managed environment resource group
    const resourceGroupName: string | undefined = resourceCreationContext.containerApp?.resourceGroup ||
        (resourceCreationContext.managedEnvironment?.id ? getResourceGroupFromId(resourceCreationContext.managedEnvironment.id) : undefined);
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(resourceCreationContext);

    resourceCreationContext.resourceGroup = resourceGroups.find(rg => resourceGroupName && rg.name === resourceGroupName);
    if (!resourceCreationContext.resourceGroup) {
        promptSteps.push(new ResourceGroupListStep());
    }
}
