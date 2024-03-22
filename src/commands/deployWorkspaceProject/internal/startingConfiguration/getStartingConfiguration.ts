/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../../../constants";
import { EnvironmentVariablesListStep } from "../../../image/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../../image/imageSource/buildImageInAzure/OSPickStep";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProjectInternal";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext): Promise<Partial<DeployWorkspaceProjectContext>> {
    // await tryAddMissingAzureResourcesToContext(context);

    const wizard: AzureWizard<DeployWorkspaceProjectInternalContext> = new AzureWizard(context, {
        promptSteps: [
            // new RootFolderStep(),
            // new DockerFileItemStep(),
            // new DwpManagedEnvironmentListStep()
        ],
        executeSteps: [
            // Todo: Add ACR defaulting step
        ]
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        rootFolder: context.rootFolder,
        dockerfilePath: context.dockerfilePath,
        resourceGroup: context.resourceGroup,
        managedEnvironment: context.managedEnvironment,
        containerApp: context.containerApp,
        registry: context.registry,
        newRegistrySku: KnownSkuName.Basic,
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : [], // Todo: revisit this
    };
}
