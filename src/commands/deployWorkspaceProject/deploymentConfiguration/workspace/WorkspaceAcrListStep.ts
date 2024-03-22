/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId, type ParsedAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { QuickPickItemKind } from "vscode";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class WorkspaceAcrListStep extends AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext> {
    public async prompt(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        context.registry = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder: localize('selectContainerRegistry', 'Select an Azure Container Registry'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.deploymentConfigurationSettings?.containerRegistry;
    }

    private async getPicks(context: WorkspaceDeploymentConfigurationContext): Promise<IAzureQuickPickItem<Registry | undefined>[]> {
        const deploymentConfigurations: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder')) ?? [];
        const registries: Registry[] = await AcrListStep.getRegistries(context);

        const configurationRegistries: Map<string, number> = new Map();
        for (const [i, config] of deploymentConfigurations.entries()) {
            if (!config.containerRegistry) {
                continue;
            }
            configurationRegistries.set(config.containerRegistry, i);
        }

        const resourceGroupItems: Map<string, IAzureQuickPickItem<Registry | undefined>[]> = new Map();
        for (const registry of registries) {
            const registryName: string = nonNullProp(registry, 'name');
            const parsedId: ParsedAzureResourceId = parseAzureResourceId(nonNullProp(registry, 'id'));

            const registryItem: IAzureQuickPickItem<Registry> = {
                label: registryName,
                data: registry
            };

            if (configurationRegistries.has(registryName)) {
                const i: number | undefined = configurationRegistries.get(registryName);
                registryItem.description = i ? `${deploymentConfigurations[i].label} $(gear)` : undefined;
            }

            const items: IAzureQuickPickItem<Registry | undefined>[] = resourceGroupItems.get(parsedId.resourceGroup) ?? [
                {
                    label: parsedId.resourceGroup,
                    kind: QuickPickItemKind.Separator,
                    data: undefined  // Separator picks aren't selectable
                }
            ];
            resourceGroupItems.set(parsedId.resourceGroup, items.concat(registryItem));
        }

        const createPick: IAzureQuickPickItem<undefined> = {
            label: localize('newContainerRegistry', '$(plus) Create new Azure Container Registry'),
            data: undefined
        };

        const picks: IAzureQuickPickItem<Registry | undefined>[] = [
            createPick,
            ...resourceGroupItems.get(context.deploymentConfigurationSettings?.resourceGroup ?? '') ?? [],  // If there's a deployment resource group, sort those ACRs on top
            ...Array.from(resourceGroupItems.keys())
                .reduce<IAzureQuickPickItem<Registry | undefined>[]>((accItems, key) => {
                    if (key === context.deploymentConfigurationSettings?.resourceGroup) {
                        // Skip this resource group since we already sorted it to the top
                        return accItems;
                    }

                    const items = resourceGroupItems.get(key);
                    if (!items) {
                        return accItems;
                    }

                    return accItems.concat(items);
                }, []),
        ];

        return picks;
    }
}
