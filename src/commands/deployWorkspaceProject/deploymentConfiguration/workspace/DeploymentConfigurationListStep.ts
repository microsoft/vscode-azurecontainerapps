/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { ContainerAppResourcesVerifyStep } from "./ContainerAppResourcesVerifyStep";
import { ContainerRegistryVerifyStep } from "./ContainerRegistryVerifyStep";
import { DockerfileValidateStep } from "./DockerfileValidateStep";
import { EnvValidateStep } from "./EnvValidateStep";
import { SrcValidateStep } from "./SrcValidateStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class DeploymentConfigurationListStep extends AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext> {
    public async prompt(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!deploymentConfigurations?.length) {
            return;
        }

        const pick = await context.ui.showQuickPick(this.getPicks(deploymentConfigurations), {
            placeHolder: localize('chooseDeployConfigurationSetting', 'Select an app configuration to deploy'),
            suppressPersistence: true,
        });

        context.deploymentConfigurationSettings = pick.data;
        context.configurationIdx = pick.data?.configurationIdx;
    }

    public shouldPrompt(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.deploymentConfigurationSettings;
    }

    public async getSubWizard(context: WorkspaceDeploymentConfigurationContext): Promise<IWizardOptions<WorkspaceDeploymentConfigurationContext> | undefined> {
        if (!context.deploymentConfigurationSettings) {
            return undefined;
        }

        return {
            executeSteps: [
                new DockerfileValidateStep(),
                new SrcValidateStep(),
                new EnvValidateStep(),
                new ContainerAppResourcesVerifyStep(),
                new ContainerRegistryVerifyStep()
            ]
        };
    }

    private getPicks(deploymentConfigurations: DeploymentConfigurationSettings[]): IAzureQuickPickItem<(DeploymentConfigurationSettings & { configurationIdx?: number }) | undefined>[] {
        const picks: IAzureQuickPickItem<DeploymentConfigurationSettings | undefined>[] = deploymentConfigurations.map((deploymentConfiguration, i) => {
            return {
                label: deploymentConfiguration.label ?? localize('unnamedApp', 'Unnamed app'),
                // Show the container app name as the description by default, unless the label has the same name
                description: deploymentConfiguration.label === deploymentConfiguration.containerApp ? undefined : deploymentConfiguration.containerApp,
                data: { ...deploymentConfiguration, configurationIdx: i }
            };
        });

        picks.push({
            label: localize('createDeploymentConfiguration', '$(plus) Create and deploy new app configuration'),
            data: undefined
        });

        return picks;
    }
}
