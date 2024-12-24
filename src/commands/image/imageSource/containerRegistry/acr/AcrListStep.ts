/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, currentlyDeployedPickDescription, noMatchingResources, noMatchingResourcesQp, recommendedPickDescription } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
import { isRecommendedPick } from "../../../../../utils/telemetryUtils";
import { type ContainerAppCreateBaseContext } from "../../../../createContainerApp/ContainerAppCreateContext";
import { type ManagedEnvironmentCreateContext } from "../../../../createManagedEnvironment/ManagedEnvironmentCreateContext";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { type CreateAcrContext } from "./createAcr/CreateAcrContext";
import { RegistryCreateStep } from "./createAcr/RegistryCreateStep";
import { RegistryNameStep } from "./createAcr/RegistryNameStep";
import { SkuListStep } from "./createAcr/SkuListStep";

export interface AcrListStepOptions {
    suppressCreate?: boolean;
}

export const acrCreatePick = {
    label: localize('newContainerRegistry', '$(plus) Create new container registry'),
    description: '',
    data: undefined
};

export class AcrListStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardPromptStep<T> {
    constructor(private readonly options?: AcrListStepOptions) {
        super();
    }

    public async prompt(context: T): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');

        let pick: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>;
        let result: Registry | typeof noMatchingResources | undefined;
        do {
            const picks: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[] = await this.getPicks(context);
            if (picks.length === 1 && picks[0] === acrCreatePick) {
                pick = acrCreatePick;
                result = undefined;
                break;
            }

            pick = (await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true }));
            result = pick.data;
        } while (result === noMatchingResources);

        context.telemetry.properties.usedRecommendedRegistry = pick && isRecommendedPick(pick) ? 'true' : 'false';
        context.registry = result;
    }

    public shouldPrompt(context: T): boolean {
        return !context.registry && !context.newRegistryName;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        const promptSteps: AzureWizardPromptStep<T>[] = [];
        const executeSteps: AzureWizardExecuteStep<T>[] = [];

        if (!context.registry) {
            promptSteps.push(
                new RegistryNameStep(),
                new SkuListStep()
            );
            executeSteps.push(new RegistryCreateStep());

            await tryConfigureResourceGroupForRegistry(context, promptSteps);

            if (context.resourceGroup) {
                await LocationListStep.setLocation(context, context.resourceGroup.location);
            } else {
                LocationListStep.addStep(context, promptSteps);
            }
        }

        return {
            promptSteps,
            executeSteps
        };
    }

    public async getPicks(context: T): Promise<IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[]> {
        const picks: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[] = [];
        if (!this.options?.suppressCreate) {
            picks.push(acrCreatePick);
        }

        const registryPicks: IAzureQuickPickItem<Registry>[] = await AcrListStep.getSortedAndRecommendedPicks(context);
        if (!picks.length && !registryPicks.length) {
            picks.push(noMatchingResourcesQp);
        }

        return picks.concat(registryPicks);
    }

    /**
     * Returns a list of registries sorted by resource group, with matching resource group sorted to the top of the list.
     * If a currently deployed registry exists, that will be sorted to the top and marked instead.
     */
    public static async getSortedAndRecommendedPicks(context: ISubscriptionActionContext & Partial<ContainerRegistryImageSourceContext>): Promise<IAzureQuickPickItem<Registry>[]> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.telemetry.properties.acrCount = String(registries.length);
        if (!registries.length) {
            return [];
        }

        const registriesByGroup: Record<string, Registry[]> = {};
        for (const r of registries) {
            if (!r.id) {
                continue;
            }

            const { resourceGroup } = parseAzureResourceId(r.id);
            const registriesGroup: Registry[] = registriesByGroup[resourceGroup] ?? [];
            registriesGroup.push(r);
            registriesByGroup[resourceGroup] = registriesGroup;
        }

        // Sort resource groups alphabetically; if matches selected resource group, prioritize to the top
        const sortedResourceGroups: string[] = Object.keys(registriesByGroup).sort((a, b) => {
            const lowA: string = a.toLocaleLowerCase();
            const lowB: string = b.toLocaleLowerCase();

            switch (true) {
                // If the user already picked a resource group, sort those to the top
                case a === context.resourceGroup?.name:
                    return -1;
                case b === context.resourceGroup?.name:
                    return 1;

                // Everything below handles normal alphabetical sorting
                case lowA < lowB:
                    return -1;
                case lowB < lowA:
                    return 1;
                default:
                    return 0;
            }
        });

        // Check for a currently deployed registry
        let currentRegistry: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single && registryDomain === acrDomain) {
                currentRegistry = registryName;
            }

            const srIndex: number = registries.findIndex((r) => !!currentRegistry && r.loginServer === currentRegistry);
            srExists = srIndex !== -1;
        }

        const picks: IAzureQuickPickItem<Registry>[] = [];
        for (const [i, rg] of sortedResourceGroups.entries()) {
            const registryGroup: Registry[] = registriesByGroup[rg];
            const maybeRecommended: string = rg === context.resourceGroup?.name && !srExists ? ` ${recommendedPickDescription}` : '';

            const groupedRegistries: IAzureQuickPickItem<Registry>[] = registryGroup.map(r => {
                const maybeDeployed: string = r.loginServer === currentRegistry ? ` ${currentlyDeployedPickDescription}` : '';
                return {
                    label: nonNullProp(r, 'name'),
                    description: rg + maybeRecommended + maybeDeployed,
                    data: r,
                };
            });

            // If a currently deployed registry exists, we can expect it to be in the first resource group because we already sorted the group to the front
            if (i === 0 && srExists) {
                groupedRegistries.sort((a, b) => {
                    if (new RegExp(currentlyDeployedPickDescription).test(a.description ?? '')) {
                        return -1;
                    } else if (new RegExp(currentlyDeployedPickDescription).test(b.description ?? '')) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }

            picks.push(...groupedRegistries);
        }

        context.telemetry.properties.recommendedRegistryCount = String(picks.reduce((count, pick) => count + (isRecommendedPick(pick) ? 1 : 0), 0));
        return picks;
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
