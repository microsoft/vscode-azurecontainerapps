/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, type AzureWizardExecuteStep, type AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { DeploymentConfigurationPromptStep } from "./DeploymentConfigurationPromptStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

// Todo: Monorepo core logic (workspace settings path) https://github.com/microsoft/vscode-azurecontainerapps/issues/613
export async function getWorkspaceDeploymentConfiguration(context: IContainerAppContext): Promise<DeploymentConfiguration> {
    const wizardContext: WorkspaceDeploymentConfigurationContext = context;

    const promptSteps: AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext>[] = [
        new RootFolderStep(),
        new DeploymentConfigurationPromptStep()
    ];

    const executeSteps: AzureWizardExecuteStep<WorkspaceDeploymentConfigurationContext>[] = [];

    const wizard: AzureWizard<WorkspaceDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        promptSteps,
        executeSteps,
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        rootFolder: wizardContext.rootFolder,
    };
}
