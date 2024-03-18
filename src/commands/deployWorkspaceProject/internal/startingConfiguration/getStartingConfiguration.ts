/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../../../constants";
import { EnvironmentVariablesListStep } from "../../../image/imageSource/EnvironmentVariablesListStep";
import { DockerFileItemStep } from "../../../image/imageSource/buildImageInAzure/DockerFileItemStep";
import { AcrBuildSupportedOS } from "../../../image/imageSource/buildImageInAzure/OSPickStep";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProjectInternal";
import { DwpManagedEnvironmentListStep } from "./DwpManagedEnvironmentListStep";
import { getResourcesFromContainerAppHelper, getResourcesFromManagedEnvironmentHelper } from "./containerAppResourceHelpers";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext): Promise<Partial<DeployWorkspaceProjectContext>> {
    await tryAddMissingAzureResourcesToContext(context);

    const wizard: AzureWizard<DeployWorkspaceProjectInternalContext> = new AzureWizard(context, {
        promptSteps: [
            new RootFolderStep(),
            new DockerFileItemStep(),
            new DwpManagedEnvironmentListStep()
        ]
    });

    await wizard.prompt();

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

async function tryAddMissingAzureResourcesToContext(context: DeployWorkspaceProjectInternalContext): Promise<void> {
    if (!context.containerApp && !context.managedEnvironment) {
        return;
    } else if (context.containerApp) {
        const resources = await getResourcesFromContainerAppHelper(context, context.containerApp);
        if (!context.resourceGroup) {
            context.resourceGroup = resources.resourceGroup;
        }
        if (!context.managedEnvironment) {
            context.managedEnvironment = resources.managedEnvironment;
        }
    } else if (context.managedEnvironment) {
        const resources = await getResourcesFromManagedEnvironmentHelper(context, context.managedEnvironment);
        if (!context.resourceGroup) {
            context.resourceGroup = resources.resourceGroup;
        }
    }
}
