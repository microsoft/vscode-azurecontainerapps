/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { type WorkspaceFolder } from "vscode";
import { createActivityContext } from "../../../../utils/activityUtils";
import { localize } from "../../../../utils/localize";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { DeploymentConfigurationListStep } from "./DeploymentConfigurationListStep";
import { DeploymentModeListStep } from "./DeploymentModeListStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export async function getWorkspaceDeploymentConfiguration(context: IContainerAppContext & { rootFolder?: WorkspaceFolder }): Promise<DeploymentConfiguration> {
    const wizardContext: WorkspaceDeploymentConfigurationContext = Object.assign(context, {
        ...await createActivityContext(),
    });

    const wizard = new AzureWizard<WorkspaceDeploymentConfigurationContext>(wizardContext, {
        title: localize('selectWorkspaceDeploymentConfigurationTitle', 'Select a workspace deployment configuration'),
        promptSteps: [
            new RootFolderStep(),
            new DeploymentConfigurationListStep(),
            new DeploymentModeListStep(),
        ],
    });

    await wizard.prompt();

    if (wizardContext.deploymentConfigurationSettings) {
        wizardContext.activityTitle = wizardContext.deploymentConfigurationSettings.label ?
            localize('loadWorkspaceDeploymentActivityTitleOne', 'Load workspace deployment configuration "{0}"', wizardContext.deploymentConfigurationSettings.label) :
            localize('loadWorkspaceDeploymentActivityTitleTwo', 'Load workspace deployment configuration');
    } else {
        wizardContext.activityTitle = localize('prepareWorkspaceDeploymentActivityTitle', 'Prepare new workspace deployment configuration');
    }

    await wizard.execute();

    return {
        deploymentMode: wizardContext.deploymentMode,
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
