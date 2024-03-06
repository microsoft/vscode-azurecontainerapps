/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, type AzureWizardExecuteStep, type AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "./DeploymentConfiguration";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

// Todo: Monorepo core logic (workspace settings path) https://github.com/microsoft/vscode-azurecontainerapps/issues/613
export async function promptForWorkspaceDeploymentConfiguration(context: IContainerAppContext): Promise<DeploymentConfiguration> {
    const promptSteps: AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext>[] = [
        new RootFolderStep()
    ];

    const executeSteps: AzureWizardExecuteStep<WorkspaceDeploymentConfigurationContext>[] = [
        // Todo
    ];

    const wizard: AzureWizard<WorkspaceDeploymentConfigurationContext> = new AzureWizard(context, {
        promptSteps,
        executeSteps,
    });

    await wizard.prompt();
    await wizard.execute();

    return {};
}
