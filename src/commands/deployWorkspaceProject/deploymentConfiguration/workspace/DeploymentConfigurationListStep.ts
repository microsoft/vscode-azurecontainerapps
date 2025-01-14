/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";
import { ContainerAppVerifyStep } from "./azureResources/ContainerAppVerifyStep";
import { ContainerRegistryVerifyStep } from "./azureResources/ContainerRegistryVerifyStep";
import { ResourceGroupVerifyStep } from "./azureResources/ResourceGroupVerifyStep";
import { DockerfileValidateStep } from "./filePaths/DockerfileValidateStep";
import { EnvUseRemoteConfigurationPromptStep } from "./filePaths/EnvUseRemoteConfigurationPromptStep";
import { EnvValidateStep } from "./filePaths/EnvValidateStep";
import { SrcValidateStep } from "./filePaths/SrcValidateStep";

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
            ext.outputChannel.appendLog(localize('createNewAppConfiguration', 'User chose to create a new app configuration.'));
            return undefined;
        }

        if (context.deploymentConfigurationSettings.label) {
            ext.outputChannel.appendLog(localize('choseExistingConfiguration', 'User chose to load existing workspace deployment configuration "{0}".', context.deploymentConfigurationSettings.label));
        } else {
            ext.outputChannel.appendLog(localize('choseExistingConfiguration', 'User chose to load existing workspace deployment configuration.'));
        }

        // We mainly want to show activity children if there are deployment settings to verify
        context.activityChildren ??= [];

        return {
            promptSteps: [
                new EnvUseRemoteConfigurationPromptStep(),
            ],
            executeSteps: [
                new DockerfileValidateStep(),
                new SrcValidateStep(),
                new EnvValidateStep(),
                new ResourceGroupVerifyStep(),
                new ContainerAppVerifyStep(),
                new ContainerRegistryVerifyStep()
            ]
        };
    }

    private getPicks(deploymentConfigurations: DeploymentConfigurationSettings[]): IAzureQuickPickItem<(DeploymentConfigurationSettings & { configurationIdx?: number }) | undefined>[] {
        const picks: IAzureQuickPickItem<DeploymentConfigurationSettings | undefined>[] = deploymentConfigurations.map((deploymentConfiguration, i) => {
            return {
                label: deploymentConfiguration.label || localize('unnamedApp', 'Unnamed app'),
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
