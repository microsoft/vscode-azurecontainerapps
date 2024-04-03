/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

const recommendedPickDescription: string = localize('recommended', '(Recommended)');
export class DwpManagedEnvironmentListStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const placeHolder: string = localize('selectManagedEnvironment', 'Select a container apps environment');
        const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = await this.getPicks(context);

        if (!picks.length) {
            // No managed environments to choose from
            return;
        }

        await this.setRecommendedPicks(context, picks);
        const pick = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });
        context.telemetry.properties.usedRecommendedEnv = pick.description === recommendedPickDescription ? 'true' : 'false';
        context.telemetry.properties.recommendedEnvCount =
            String(picks.reduce((count, p) => count + (p.description === recommendedPickDescription ? 1 : 0), 0));

        const managedEnvironment: ManagedEnvironment | undefined = pick.data;
        if (!managedEnvironment) {
            // User is choosing to create a new managed environment
            return;
        }

        await this.setContextWithManagedEnvironmentResources(context, managedEnvironment);
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return !context.managedEnvironment;
    }

    private async getPicks(context: DeployWorkspaceProjectInternalContext): Promise<IAzureQuickPickItem<ManagedEnvironment | undefined>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(
            context.resourceGroup ?
                client.managedEnvironments.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
                client.managedEnvironments.listBySubscription()
        );

        if (!managedEnvironments.length) {
            return [];
        }

        return [
            {
                label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
                data: undefined
            },
            ...managedEnvironments.map(env => {
                return {
                    label: nonNullProp(env, 'name'),
                    data: env
                };
            })
        ];
    }

    private async setContextWithManagedEnvironmentResources(context: DeployWorkspaceProjectInternalContext, managedEnvironment: ManagedEnvironment): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
        context.managedEnvironment = managedEnvironment;
    }

    private async setRecommendedPicks(context: DeployWorkspaceProjectInternalContext, picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[]): Promise<void> {
        const recommendedEnvCount = 0;
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!deploymentConfigurations?.length) {
            return;
        }

        const client = await createContainerAppsAPIClient(context);
        for (const config of deploymentConfigurations) {
            try {
                if (config.resourceGroup && config.containerApp) {
                    const containerApp = await client.containerApps.get(config.resourceGroup, config.containerApp);
                    const recommendedPick = picks.find(p => p.data?.id === containerApp.managedEnvironmentId);
                    if (recommendedPick) {
                        recommendedPick.description = recommendedPickDescription;
                    }
                }
            }
            catch (these_hands) {
                // ignore the error and continue
            }
        }

        const recommendedPick = (pick: IAzureQuickPickItem<ManagedEnvironment | undefined>): boolean => {
            if (pick.description === recommendedPickDescription) {
                return true;
            }

            return false;
        };
        // sort the picks by recommendation
        picks.sort((a, b) => {
            if (recommendedPick(a)) {
                return -1;
            } else if (recommendedPick(b)) {
                return 1;
            } else {
                return 0;
            }
        });

        context.telemetry.properties.recommendedManagedEnvironmentCount = String(recommendedEnvCount);
    }
}
