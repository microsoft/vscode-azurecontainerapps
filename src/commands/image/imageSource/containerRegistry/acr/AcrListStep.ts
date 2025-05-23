/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, noMatchingResources, noMatchingResourcesQp } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
import { currentlyDeployedPickDescription, hasMatchingPickDescription } from "../../../../../utils/pickUtils";
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
    data: undefined
};

export class AcrListStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardPromptStep<T> {
    constructor(private readonly options?: AcrListStepOptions) {
        super();
    }

    private pickLabel: string;

    public async prompt(context: T): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');

        let pick: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>;
        let result: Registry | typeof noMatchingResources | undefined;
        do {
            const picks: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[] = await this.getPicks(context);
            if (picks.length === 1 && picks[0] === acrCreatePick) {
                pick = acrCreatePick;
                result = pick.data as typeof acrCreatePick['data'];
                break;
            }

            pick = await context.ui.showQuickPick(picks, { placeHolder, enableGrouping: true, suppressPersistence: true });
            result = pick.data;
        } while (result === noMatchingResources);

        this.pickLabel = pick.label;
        context.registry = result;
    }

    public shouldPrompt(context: T): boolean {
        return !context.registry && !context.newRegistryName;
    }

    public confirmationViewProperty(_context: T): { name: string; value: string; valueInContext: string } {
        return {
            name: localize('registry', 'Registry'),
            value: this.pickLabel ?? '',
            valueInContext: 'registry'
        }
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

            if (!LocationListStep.hasLocation(context) && context.resourceGroup) {
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
            return [noMatchingResourcesQp];
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
        let hasCurrentRegistry: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single && registryDomain === acrDomain) {
                currentRegistry = registryName;

                const crIndex: number = registries.findIndex((r) => !!currentRegistry && r.loginServer === currentRegistry);
                hasCurrentRegistry = crIndex !== -1;
            }
        }

        const picks: IAzureQuickPickItem<Registry>[] = [];
        let hasSameRgRegistry: boolean = false;
        context.telemetry.properties.sameRgAcrCount = '0';
        for (const [i, rg] of sortedResourceGroups.entries()) {
            const registriesGroup: Registry[] = registriesByGroup[rg];

            // Same resource group would be sorted to the top of the list...
            let maybeSameRg: string | undefined;
            if (i === 0 && !hasCurrentRegistry && rg === context.resourceGroup?.name) {
                maybeSameRg = localize('sameRg', 'Within Same Resource Group');
                context.telemetry.properties.sameRgAcrCount = String(registriesGroup.length);
                hasSameRgRegistry = true;
            }

            // ...any "Other" resource groups would come after
            let maybeOtherRg: string | undefined;
            if (i > 0 && hasSameRgRegistry) {
                maybeOtherRg = localize('other', 'Other');
            }

            const groupedRegistries: IAzureQuickPickItem<Registry>[] = registriesGroup.map(r => {
                const maybeDeployed: string = r.loginServer === currentRegistry ? ` ${currentlyDeployedPickDescription}` : '';
                return {
                    label: nonNullProp(r, 'name'),
                    group: maybeSameRg || maybeOtherRg,
                    description: maybeDeployed || rg,
                    data: r,
                };
            });

            picks.push(...groupedRegistries);
        }

        // If a currently deployed registry exists, bring it to the front of the list
        if (hasCurrentRegistry) {
            const cdIdx: number = picks.findIndex(p => hasMatchingPickDescription(p, currentlyDeployedPickDescription));
            if (cdIdx !== -1) {
                const currentlyDeployedPick: IAzureQuickPickItem<Registry> | undefined = picks.splice(cdIdx, 1)[0];
                picks.unshift(currentlyDeployedPick);
            }
        }

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
