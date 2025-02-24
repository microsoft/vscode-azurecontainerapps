/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { hasMatchingPickDescription, recommendedPickDescription } from "../../../../utils/pickUtils";
import { type ManagedEnvironmentPick, type ManagedEnvironmentRecommendedPicksStrategy } from "../../../createManagedEnvironment/ManagedEnvironmentListStep";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

export class DwpManagedEnvironmentRecommendedPicksStrategy<T extends DeployWorkspaceProjectInternalContext> implements ManagedEnvironmentRecommendedPicksStrategy<T> {
    async setRecommendedPicks(context: T, picks: ManagedEnvironmentPick[]): Promise<void> {
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
    }
}
