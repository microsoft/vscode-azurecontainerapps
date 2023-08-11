/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullValue, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { Uri, WorkspaceFolder, commands, workspace } from "vscode";
import { ImageSource, ROOT_DOCKERFILE_GLOB_PATTERN } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { getRootWorkspaceFolder } from "../../utils/workspaceUtils";
import { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";
import { AcrBuildSupportedOS } from "../deployImage/imageSource/buildImageInAzure/OSPickStep";

type IDeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & IBuildImageInAzureContext;

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    const subscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    // Todo
    // Check to make sure location providers work the way we expect
    // Add dockerfile port detection logic and auto default function

    const wizardContext: IDeployWorkspaceProjectContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        ...await setDeployWorkspaceDefaultValues(),
        subscription,
    };

    const promptSteps: AzureWizardPromptStep<IDeployWorkspaceProjectContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IDeployWorkspaceProjectContext>[] = [];

    // Verify how we need to handle running `addProviderForFiltering` and `VerifyProvidersStep` across all scenarios...
    // Add way to create registry in AcrListStep

    const wizard: AzureWizard<IDeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: 'placeholder',
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    ext.branchDataProvider.refresh();
}

async function setDeployWorkspaceDefaultValues() {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths();
    const resourceBaseName: string = nonNullValue(rootFolder.uri.path.split('/').at(-1));

    return {
        newResourceGroupName: `${resourceBaseName}-rg`,
        newManagedEnvironmentName: `${resourceBaseName}-env`,
        newContainerAppName: `${resourceBaseName}-ca`,
        newAzureContainerRegistry: `${resourceBaseName}-acr`,
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
        dockerfilePath

        // imageName

        // Port step logic...
        // enableIngress: true
        // enableExternal: true
        // targetPort

        // location or prompt??
    };
}

async function getWorkspaceProjectPaths(): Promise<{ rootFolder: WorkspaceFolder, dockerfilePath: string }> {
    const prompt: string = localize('selectRootWorkspace', 'Select a project with a Dockerfile');
    const rootFolder: WorkspaceFolder | undefined = await getRootWorkspaceFolder(prompt);

    if (!rootFolder) {
        // VS Code should reload after executing
        await commands.executeCommand('vscode.openFolder');
    }

    // Check if chosen workspace has a Dockerfile at its root
    const dockerfileUris: Uri[] = await workspace.findFiles(ROOT_DOCKERFILE_GLOB_PATTERN);
    if (!dockerfileUris.length) {
        throw new Error(localize('noDockerfileError', 'Unable to locate a Dockerfile in your project\'s root.'));
    } else if (dockerfileUris.length > 1) {
        throw new Error(localize('multipleDockerfileError', 'Unable to determine the correct Dockerfile to use in your project\'s root.'));
    }

    return {
        rootFolder: nonNullValue(rootFolder),
        dockerfilePath: dockerfileUris[0].path
    };
}
