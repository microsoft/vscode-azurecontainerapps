/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry } from "@azure/arm-containerregistry";
import { LocationListStep, ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { noMatchingResources, noMatchingResourcesQp, registryProvider, registryResourceType } from "../../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { localize } from "../../../../../utils/localize";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { AcrResourceGroupAndDeployedPickUpdateStrategy } from "./AcrResourceGroupAndDeployedPickUpdateStrategy";
import { RegistryCreateStep } from "./createAcr/RegistryCreateStep";
import { RegistryNameStep } from "./createAcr/RegistryNameStep";
import { SkuListStep } from "./createAcr/SkuListStep";

export interface AcrListStepOptions {
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
        if (context.registry) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<T>[] = [];
        const executeSteps: AzureWizardExecuteStep<T>[] = [];

        if (!context.resourceGroup) {
            promptSteps.push(new ResourceGroupListStep());
        }

        promptSteps.push(
            new RegistryNameStep(),
            new SkuListStep(),
        );

        LocationListStep.addProviderForFiltering(context, registryProvider, registryResourceType);
        LocationListStep.addStep(context, promptSteps);

        executeSteps.push(new RegistryCreateStep());

        return { promptSteps, executeSteps };
    }

    public static async getRegistries(context: ISubscriptionActionContext): Promise<Registry[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        return await uiUtils.listAllIterator(client.registries.list());
    }
}
