/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { hasMatchingPickDescription, recommendedPickDescription } from "../../../utils/pickUtils";
import { type ManagedEnvironmentPick, type ManagedEnvironmentPickUpdateStrategy } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { type DeploymentConfigurationSettings } from "../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

// Todo: We should make the recommended picks the group level label
// Descriptions should be the resource group

export class ManagedEnvironmentRecommendWorkspacePicksStrategy<T extends DeployWorkspaceProjectInternalContext> implements ManagedEnvironmentPickUpdateStrategy {
    async updatePicks(context: T, picks: ManagedEnvironmentPick[]): Promise<ManagedEnvironmentPick[]> {
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!deploymentConfigurations?.length) {
            return picks;
        }

        // Todo: The performance for this kind of sucks, we need to run this check concurrently
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

        // sort the picks by recommendation
        picks.sort((a, b) => {
            if (hasMatchingPickDescription(a, recommendedPickDescription)) {
                return -1;
            } else if (hasMatchingPickDescription(b, recommendedPickDescription)) {
                return 1;
            } else {
                return 0;
            }
        });

        context.telemetry.properties.recommendedEnvCount =
            String(picks.reduce((count, pick) => count + (hasMatchingPickDescription(pick, recommendedPickDescription) ? 1 : 0), 0));

        return picks;
    }
}
