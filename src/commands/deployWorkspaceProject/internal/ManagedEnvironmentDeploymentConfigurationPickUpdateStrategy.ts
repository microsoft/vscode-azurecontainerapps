/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedEnvironmentPick, type ManagedEnvironmentPickUpdateStrategy } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { type DeploymentConfigurationSettings } from "../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

export class ManagedEnvironmentDeploymentConfigurationPickUpdateStrategy<T extends DeployWorkspaceProjectInternalContext> implements ManagedEnvironmentPickUpdateStrategy {
    async updatePicks(context: T, picks: ManagedEnvironmentPick[]): Promise<ManagedEnvironmentPick[]> {
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!deploymentConfigurations?.length) {
            return picks;
        }

        const asyncTasks: Promise<void>[] = [];
        const recommendedEnvironmentIds: Set<string> = new Set();

        const client = await createContainerAppsAPIClient(context);
        for (const config of deploymentConfigurations) {
            if (!config.resourceGroup || !config.containerApp) {
                continue;
            }
            asyncTasks.push(
                (async () => {
                    const id: string | undefined = await getManagedEnvironmentId(client, nonNullProp(config, 'resourceGroup'), nonNullProp(config, 'containerApp'));
                    if (id) recommendedEnvironmentIds.add(id);
                })(),
            );
        }

        await Promise.allSettled(asyncTasks);

        const recommendedPicks: ManagedEnvironmentPick[] = [];
        const otherPicks: ManagedEnvironmentPick[] = [];
        for (const p of picks) {
            const id: string = nonNullProp(p.data, 'id');
            p.description = parseAzureResourceId(id).resourceGroup;

            if (recommendedEnvironmentIds.has(id)) {
                p.group = localize('recommended', 'Recommended');
                recommendedPicks.push(p);
            } else {
                p.group = localize('other', 'Other');
                otherPicks.push(p);
            }
        }

        context.telemetry.properties.recommendedEnvCount = String(recommendedPicks.length);

        return [...recommendedPicks, ...otherPicks];
    }
}

async function getManagedEnvironmentId(client: ContainerAppsAPIClient, resourceGroupName: string, containerAppName: string): Promise<string | undefined> {
    try {
        const containerApp: ContainerApp = await client.containerApps.get(resourceGroupName, containerAppName);
        return containerApp.managedEnvironmentId;
    }
    catch (these_hands) {
        return undefined;
    }
}
