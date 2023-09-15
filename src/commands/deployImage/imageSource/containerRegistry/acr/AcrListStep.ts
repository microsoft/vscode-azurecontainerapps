/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, AzureWizardPromptStep, IAzureQuickPickItem, ISubscriptionActionContext, IWizardOptions, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ImageSource, acrDomain, currentlyDeployed, quickStartImageName } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
import { ICreateContainerAppContext } from "../../../../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../../../../createManagedEnvironment/IManagedEnvironmentContext";
import type { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";
import { CreateAcrContext } from "./createAcr/CreateAcrContext";
import { RegistryCreateStep } from "./createAcr/RegistryCreateStep";
import { RegistryNameStep } from "./createAcr/RegistryNameStep";
import { SkuListStep } from "./createAcr/SkuListStep";

export class AcrListStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');
        context.registry = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.registry && !context.newRegistryName;
    }

    public async getSubWizard(context: IContainerRegistryImageContext): Promise<IWizardOptions<IContainerRegistryImageContext> | undefined> {
        if (!context.registry) {
            const promptSteps: AzureWizardPromptStep<IContainerRegistryImageContext>[] = [
                new RegistryNameStep(),
                new SkuListStep()
            ];

            const executeSteps: AzureWizardExecuteStep<IContainerRegistryImageContext>[] = [
                new RegistryCreateStep()
            ];

            await tryConfigureResourceGroupForRegistry(context, promptSteps, executeSteps);
            LocationListStep.addStep(context, promptSteps);

            return {
                promptSteps,
                executeSteps
            };
        }

        if (context.registry && !context.registry?.adminUserEnabled) {
            return { promptSteps: [new RegistryEnableAdminUserStep()] }
        }

        return undefined;
    }

    public async getPicks(context: IContainerRegistryImageContext): Promise<IAzureQuickPickItem<Registry | undefined>[]> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);

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

        const picks: IAzureQuickPickItem<Registry | undefined>[] = [];

        const suppressCreate: boolean = context.imageSource !== ImageSource.RemoteAcrBuild;
        if (!suppressCreate) {
            picks.push({
                label: localize('newContainerRegistry', '$(plus) Create new Azure Container Registry'),
                description: '',
                data: undefined
            });
        }

        return picks.concat(
            registries.map((r) => {
                return !!suggestedRegistry && r.loginServer === suggestedRegistry ?
                    { label: nonNullProp(r, 'name'), data: r, description: `${r.loginServer} ${currentlyDeployed}`, suppressPersistence: true } :
                    { label: nonNullProp(r, 'name'), data: r, description: r.loginServer, suppressPersistence: srExists || !suppressCreate };
            })
        );
    }

    public static async getRegistries(context: ISubscriptionActionContext): Promise<Registry[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        return await uiUtils.listAllIterator(client.registries.list());
    }
}

async function tryConfigureResourceGroupForRegistry(
    context: IContainerRegistryImageContext,
    promptSteps: AzureWizardPromptStep<IContainerRegistryImageContext>[],
    executeSteps: AzureWizardExecuteStep<IContainerRegistryImageContext>[]
): Promise<void> {
    // No need to pollute the base context with all the potential pre-create typings as they are not otherwise used
    const resourceCreationContext = context as Partial<ICreateContainerAppContext> & Partial<IManagedEnvironmentContext> & CreateAcrContext;
    if (resourceCreationContext.resourceGroup || resourceCreationContext.newResourceGroupName) {
        return;
    }

    // Try to infer a re-usable resource group
    let resourceGroupName: string | undefined;
    if (resourceCreationContext.containerApp) {
        resourceGroupName = resourceCreationContext.containerApp.resourceGroup;
    } else {
        resourceGroupName = resourceCreationContext.managedEnvironment?.name;
    }

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(resourceCreationContext);
    resourceCreationContext.resourceGroup = resourceGroups.find(rg => resourceGroupName && rg.name === resourceGroupName);

    if (!resourceCreationContext.resourceGroup) {
        resourceCreationContext.newResourceGroupName = resourceCreationContext.newManagedEnvironmentName || resourceCreationContext.newRegistryName;
    }

    // Add steps to match the resources found
    if (!resourceCreationContext.resourceGroup && !resourceCreationContext.newResourceGroupName) {
        promptSteps.push(new ResourceGroupListStep());
    } else {
        executeSteps.push(new ResourceGroupCreateStep());
    }
}
