/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, currentlyDeployed, noMatchingResources, noMatchingResourcesQp, quickStartImageName } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
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

export class AcrListStep extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    constructor(private readonly options?: AcrListStepOptions) {
        super();
    }

    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');

        let result: Registry | typeof noMatchingResources | undefined;
        do {
            result = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
        } while (result === noMatchingResources)

        context.registry = result;
    }

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
        return !context.registry && !context.newRegistryName;
    }

    public async getSubWizard(context: ContainerRegistryImageSourceContext): Promise<IWizardOptions<ContainerRegistryImageSourceContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<ContainerRegistryImageSourceContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<ContainerRegistryImageSourceContext>[] = [];

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

    public async getPicks(context: ContainerRegistryImageSourceContext): Promise<IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[]> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.telemetry.properties.acrCount = String(registries.length);

        // Try to suggest a registry only when the user is deploying to a Container App
        let suggestedRegistry: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName, imageNameReference } = parseImageName(getLatestContainerAppImage(context.containerApp));

            // If the image is not the default quickstart image, then we can try to suggest a registry based on the latest Container App image
            if (registryDomain === acrDomain && imageNameReference !== quickStartImageName) {
                suggestedRegistry = registryName;
            }

            // Does the suggested registry exist in the list of pulled registries?  If so, move it to the front of the list
            const srIndex: number = registries.findIndex((r) => !!suggestedRegistry && r.loginServer === suggestedRegistry);
            srExists = srIndex !== -1;
            if (srExists) {
                const sr: Registry = registries.splice(srIndex, 1)[0];
                registries.unshift(sr);
            }
        }

        const picks: IAzureQuickPickItem<Registry | typeof noMatchingResources | undefined>[] = [];
        if (!this.options?.suppressCreate) {
            picks.push({
                label: localize('newContainerRegistry', '$(plus) Create new Azure Container Registry'),
                description: '',
                data: undefined
            });
        }
        if (!picks.length && !registries.length) {
            picks.push(noMatchingResourcesQp);
        }

        return picks.concat(
            registries.map((r) => {
                return !!suggestedRegistry && r.loginServer === suggestedRegistry ?
                    { label: nonNullProp(r, 'name'), data: r, description: `${r.loginServer} ${currentlyDeployed}`, suppressPersistence: true } :
                    { label: nonNullProp(r, 'name'), data: r, description: r.loginServer, suppressPersistence: srExists || !this.options?.suppressCreate };
            })
        );
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
