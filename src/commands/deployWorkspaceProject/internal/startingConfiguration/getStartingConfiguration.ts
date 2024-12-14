/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../../../constants";
import { EnvironmentVariablesListStep } from "../../../image/imageSource/EnvironmentVariablesListStep";
import { DockerfileItemStep } from "../../../image/imageSource/buildImageInAzure/DockerfileItemStep";
import { AcrBuildSupportedOS } from "../../../image/imageSource/buildImageInAzure/OSPickStep";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";
import { DwpContainerRegistryListStep } from "./DwpContainerRegistryListStep";
import { DwpManagedEnvironmentListStep } from "./DwpManagedEnvironmentListStep";
import { getResourcesFromContainerAppHelper, getResourcesFromManagedEnvironmentHelper } from "./containerAppsResourceHelpers";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext): Promise<Partial<DeployWorkspaceProjectInternalContext>> {
    await tryAddMissingAzureResourcesToContext(context);

    const wizard: AzureWizard<DeployWorkspaceProjectInternalContext> = new AzureWizard(context, {
        promptSteps: [
            new RootFolderStep(),
            new DockerfileItemStep(),
            new DwpManagedEnvironmentListStep(),
            new DwpContainerRegistryListStep(),
        ],
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
        envPath: context.envPath,
        environmentVariables:
            context.envPath !== undefined ?
                undefined /** No need to set anything if there's an envPath, the step will handle parsing the data for us */ :
                await EnvironmentVariablesListStep.workspaceHasEnvFile(context.rootFolder) ? undefined /** Step will prompt */ : [] /** "skipForNow" */,
    };
}

async function tryAddMissingAzureResourcesToContext(context: DeployWorkspaceProjectInternalContext): Promise<void> {
    if (!context.containerApp && !context.managedEnvironment) {
        return;
    } else if (context.containerApp) {
        const resources = await getResourcesFromContainerAppHelper(context, context.containerApp);
        context.resourceGroup ??= resources.resourceGroup;
        context.managedEnvironment ??= resources.managedEnvironment;
    } else if (context.managedEnvironment) {
        const resources = await getResourcesFromManagedEnvironmentHelper(context, context.managedEnvironment);
        context.resourceGroup ??= resources.resourceGroup;
    }
}
