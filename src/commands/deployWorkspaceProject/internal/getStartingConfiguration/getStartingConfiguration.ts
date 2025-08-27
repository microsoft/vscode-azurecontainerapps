/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { ImageSource } from "../../../../constants";
import { ManagedEnvironmentListStep } from "../../../createManagedEnvironment/ManagedEnvironmentListStep";
import { EnvFileListStep } from "../../../image/imageSource/EnvFileListStep";
import { AcrBuildSupportedOS } from "../../../image/imageSource/buildImageInAzure/OSPickStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";
import { type DeployWorkspaceProjectInternalOptions } from "../deployWorkspaceProjectInternal";
import { getResourcesFromContainerAppHelper } from "./containerAppResourceHelpers";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext, options: DeployWorkspaceProjectInternalOptions): Promise<Partial<DeployWorkspaceProjectInternalContext>> {
    await tryAddMissingAzureResourcesToContext(context);

    return {
        resourceGroup: context.resourceGroup,
        logAnalyticsWorkspace: context.logAnalyticsWorkspace,
        managedEnvironment: context.managedEnvironment,
        containerApp: context.containerApp,
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
    if (context.containerApp && (!context.resourceGroup || !context.managedEnvironment)) {
        const resources = await getResourcesFromContainerAppHelper(context, context.containerApp);
        context.resourceGroup ??= resources.resourceGroup;
        context.managedEnvironment ??= resources.managedEnvironment;
    }

    if (context.managedEnvironment) {
        await ManagedEnvironmentListStep.populateContextWithRelatedResources(context, context.managedEnvironment);
    }
}
