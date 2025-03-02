/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { ImageSource } from "../../../constants";
import { ContainerAppListStep } from "../../createContainerApp/ContainerAppListStep";
import { ManagedEnvironmentListStep } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { EnvFileListStep } from "../../image/imageSource/EnvFileListStep";
import { AcrBuildSupportedOS } from "../../image/imageSource/buildImageInAzure/OSPickStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { type DeployWorkspaceProjectInternalOptions } from "./deployWorkspaceProjectInternal";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext, options: DeployWorkspaceProjectInternalOptions): Promise<Partial<DeployWorkspaceProjectInternalContext>> {
    await tryAddMissingAzureResourcesToContext(context);

    return {
        suppressEnableAdminUserPrompt: options.suppressConfirmation,
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        newRegistrySku: !options.advancedCreate ? KnownSkuName.Basic : undefined,
        environmentVariables:
            context.envPath ?
                undefined /** No need to set anything if there's an envPath, the step will handle parsing the data for us */ :
                await EnvFileListStep.workspaceHasEnvFile(context.rootFolder) ? undefined : [] /** The equivalent of "skipForNow" */,
    };
}

async function tryAddMissingAzureResourcesToContext(context: DeployWorkspaceProjectInternalContext): Promise<void> {
    if (!context.containerApp && !context.managedEnvironment && !context.resourceGroup) {
        return;
    } else if (context.containerApp) {
        await ContainerAppListStep.populateContextWithContainerApp(context, context.containerApp);
    } else if (context.managedEnvironment) {
        await ManagedEnvironmentListStep.populateContextWithManagedEnvironment(context, context.managedEnvironment);
    } else if (context.resourceGroup) {
        // Todo: Inquire if this makes sense
        if (!LocationListStep.hasLocation(context)) {
            await LocationListStep.setLocation(context, context.resourceGroup.location);
        }
    }
}
