/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type RegistryPassword } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, parseAzureResourceGroupId } from "@microsoft/vscode-azext-azureutils";
import { createSubscriptionContext, subscriptionExperience, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { Uri, type WorkspaceFolder } from "vscode";
import { ext } from "../../extensionVariables";
import { getWorkspaceFolderFromPath } from "../../utils/workspaceUtils";
import { type IContainerAppContext } from "../IContainerAppContext";
import { type DeployWorkspaceProjectContext } from "../deployWorkspaceProject/DeployWorkspaceProjectContext";
import { deployWorkspaceProjectInternal } from "../deployWorkspaceProject/deployWorkspaceProjectInternal";
import { listCredentialsFromRegistry } from "../image/imageSource/containerRegistry/acr/listCredentialsFromRegistry";
import type * as api from "./vscode-azurecontainerapps.api";

export async function deployWorkspaceProjectApi(context: IActionContext, deployWorkspaceProjectOptions: api.DeployWorkspaceProjectOptionsContract): Promise<api.DeployWorkspaceProjectResults> {
    const { resourceGroupId, rootPath, dockerfilePath, srcPath, suppressConfirmation, suppressContainerAppCreation, ignoreExistingDeploySettings, shouldSaveDeploySettings } = deployWorkspaceProjectOptions;

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        selectBySubscriptionId: getSubscriptionIdFromOptions(deployWorkspaceProjectOptions),
        showLoadingPrompt: false
    });
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const rootFolder: WorkspaceFolder | undefined = rootPath ? getWorkspaceFolderFromPath(rootPath) : undefined;
    const resourceGroup: ResourceGroup | undefined = resourceGroupId ? await getResourceGroupFromId({ ...context, ...subscriptionContext }, resourceGroupId) : undefined;

    const deployWorkspaceProjectInternalContext: IContainerAppContext & Partial<DeployWorkspaceProjectContext> = Object.assign(context, {
        ...subscriptionContext,
        subscription,
        resourceGroup,
        rootFolder,
        srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
        dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
        suppressConfirmation,
        ignoreExistingDeploySettings,
        shouldSaveDeploySettings: !!shouldSaveDeploySettings,
    });

    const deployWorkspaceProjectResultContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, undefined, {
        // Don't show activity log updates in ACA when another client extension calls into this API.
        // Let each client decide how it wants to show its own activity log updates.
        suppressActivity: true,
        suppressConfirmation,
        suppressContainerAppCreation,
        suppressProgress: true,
        suppressWizardTitle: true,
    });

    const registryCredentials: { username: string, password: RegistryPassword } | undefined = deployWorkspaceProjectResultContext.registry ?
        await listCredentialsFromRegistry(deployWorkspaceProjectResultContext, deployWorkspaceProjectResultContext.registry) : undefined;

    return {
        resourceGroupId: deployWorkspaceProjectResultContext.resourceGroup?.id,
        logAnalyticsWorkspaceId: deployWorkspaceProjectResultContext.logAnalyticsWorkspace?.id,
        managedEnvironmentId: deployWorkspaceProjectResultContext.managedEnvironment?.id,
        containerAppId: deployWorkspaceProjectResultContext.containerApp?.id,
        registryId: deployWorkspaceProjectResultContext.registry?.id,
        registryLoginServer: deployWorkspaceProjectResultContext.registry?.loginServer,
        registryUsername: registryCredentials?.username,
        registryPassword: registryCredentials?.password.value,
        imageName: deployWorkspaceProjectResultContext.imageName
    };
}

function getSubscriptionIdFromOptions(deployWorkspaceProjectOptions: api.DeployWorkspaceProjectOptionsContract): string | undefined {
    if (deployWorkspaceProjectOptions.subscriptionId) {
        return deployWorkspaceProjectOptions.subscriptionId;
    } else if (deployWorkspaceProjectOptions.resourceGroupId) {
        return parseAzureResourceGroupId(deployWorkspaceProjectOptions.resourceGroupId).subscriptionId as string;
    } else {
        return undefined;
    }
}

async function getResourceGroupFromId(context: ISubscriptionActionContext, resourceGroupId: string): Promise<ResourceGroup | undefined> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    return resourceGroups.find(rg => rg.id === resourceGroupId);
}
