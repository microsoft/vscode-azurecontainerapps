/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { type Workspace } from "@azure/arm-operationalinsights";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { ImageSource } from "../../../../constants";
import { LogAnalyticsListStep } from "../../../createManagedEnvironment/LogAnalyticsListStep";
import { EnvFileListStep } from "../../../image/imageSource/EnvFileListStep";
import { AcrBuildSupportedOS } from "../../../image/imageSource/buildImageInAzure/OSPickStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";
import { type DeployWorkspaceProjectInternalOptions } from "../deployWorkspaceProjectInternal";
import { getResourcesFromContainerAppHelper, getResourcesFromManagedEnvironmentHelper } from "./containerAppResourceHelpers";

export async function getStartingConfiguration(context: DeployWorkspaceProjectInternalContext, options: DeployWorkspaceProjectInternalOptions): Promise<Partial<DeployWorkspaceProjectInternalContext>> {
    await tryAddMissingAzureResourcesToContext(context, options);

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

async function tryAddMissingAzureResourcesToContext(context: DeployWorkspaceProjectInternalContext, options: DeployWorkspaceProjectInternalOptions): Promise<void> {
    if (!options.advancedCreate) {
        if (context.containerApp && (!context.resourceGroup || !context.managedEnvironment)) {
            const resources = await getResourcesFromContainerAppHelper(context, context.containerApp);
            context.resourceGroup ??= resources.resourceGroup;
            context.managedEnvironment ??= resources.managedEnvironment;
        }

        if (context.managedEnvironment && !context.resourceGroup) {
            const resources = await getResourcesFromManagedEnvironmentHelper(context, context.managedEnvironment);
            context.resourceGroup ??= resources.resourceGroup;
        }

        if (!LocationListStep.hasLocation(context)) {
            await tryAddMissingLocationToContext(context);
        }
    }

    if (!context.logAnalyticsWorkspace && context.managedEnvironment) {
        const workspaces: Workspace[] = await LogAnalyticsListStep.getLogAnalyticsWorkspaces(context);
        context.logAnalyticsWorkspace = workspaces.find(w => w.customerId && w.customerId === context.managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId);
    }
}

async function tryAddMissingLocationToContext(context: DeployWorkspaceProjectInternalContext): Promise<void> {
    if (context.managedEnvironment) {
        await LocationListStep.setLocation(context, context.managedEnvironment.location);
    } else if (context.resourceGroup) {
        await LocationListStep.setLocation(context, context.resourceGroup.location);
    } else if (context.containerApp) {
        await LocationListStep.setLocation(context, context.containerApp.location);
    }
}
