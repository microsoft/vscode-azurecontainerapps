/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { createActivityContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { DeploymentConfigurationListStep } from "./DeploymentConfigurationListStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";
import { TryUseExistingWorkspaceRegistryStep } from "./azureResources/TryUseExistingWorkspaceRegistryStep";

export async function getWorkspaceDeploymentConfiguration(context: IContainerAppContext): Promise<DeploymentConfiguration> {
    const wizardContext: WorkspaceDeploymentConfigurationContext = Object.assign(context, {
        ...await createActivityContext(),
        activityTitle: localize('loadWorkspaceSettingsActivityTitle', 'Load workspace deployment configuration'),
        activityChildren: []
    });

    const wizard: AzureWizard<WorkspaceDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        title: localize('selectWorkspaceSettingsTitle', 'Select workspace deployment configuration'),
        promptSteps: [
            new RootFolderStep(),
            new DeploymentConfigurationListStep(),
        ],
        executeSteps: [
            new TryUseExistingWorkspaceRegistryStep()
        ]
    });

    await wizard.prompt();

    if (wizardContext.deploymentConfigurationSettings) {
        wizardContext.activityTitle = localize('loadWorkspaceSettingsActivityTitle', 'Load workspace deployment configuration "{0}"', wizardContext.deploymentConfigurationSettings.label);
    }

    await wizard.execute();

    return {
        configurationIdx: wizardContext.configurationIdx,
        rootFolder: wizardContext.rootFolder,
        dockerfilePath: wizardContext.dockerfilePath,
        srcPath: wizardContext.srcPath,
        envPath: wizardContext.envPath,
        resourceGroup: wizardContext.resourceGroup,
        containerApp: wizardContext.containerApp,
        registry: wizardContext.registry
    };
}
