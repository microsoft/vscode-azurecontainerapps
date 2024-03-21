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
        const deploymentConfigurations: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder')) ?? [];

        context.registry = (await context.ui.showQuickPick(this.getPicks(context, deploymentConfigurations), {
            placeHolder: localize('selectContainerRegistry', 'Select an Azure Container Registry'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.deploymentConfigurationSettings?.containerRegistry;
    }

    private async getPicks(context: WorkspaceDeploymentConfigurationContext, deploymentConfigurations: DeploymentConfigurationSettings[]): Promise<IAzureQuickPickItem<Registry | undefined>[]> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);

        const configurationRegistries: Set<string> = new Set();
        for (const config of deploymentConfigurations) {
            configurationRegistries.add(config.containerRegistry || 'Unnamed app');
        }

        const configurationItems: IAzureQuickPickItem<Registry>[] = [];
        const otherItems: IAzureQuickPickItem<Registry>[] = [];

        for (const registry of registries) {
            const registryName: string = nonNullProp(registry, 'name');
            const parsedId: ParsedAzureResourceId = parseAzureResourceId(nonNullProp(registry, 'id'));
            const registryItem: IAzureQuickPickItem<Registry> = {
                label: registryName,
                description: `Resource group: "${parsedId.resourceGroup}"`,
                data: registry
            };

            if (configurationRegistries.has(registryName)) {
                configurationItems.push(registryItem);
            } else {
                otherItems.push(registryItem);
            }
        }

        const createPick: IAzureQuickPickItem<undefined> = {
            label: localize('newContainerRegistry', '$(plus) Create new Azure Container Registry'),
            data: undefined
        };

        const picks: IAzureQuickPickItem<Registry | undefined>[] = [
            // Deployment configuration registries
            {
                label: localize('deploymentConfigurations', 'Deployment Configurations'),
                kind: QuickPickItemKind.Separator,
                data: undefined  // Separator picks aren't selectable
            },
            ...configurationItems,

            // Other registries
            {
                label: localize('other', 'Other'),
                kind: QuickPickItemKind.Separator,
                data: undefined  // Separator picks aren't selectable
            },
            ...otherItems,

            createPick
        ];

        return picks;
    }
}
