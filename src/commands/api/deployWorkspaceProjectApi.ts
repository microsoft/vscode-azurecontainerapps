/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, parseAzureResourceGroupId, parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, subscriptionExperience, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { Uri, type WorkspaceFolder } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { getWorkspaceFolderFromPath } from "../../utils/workspaceUtils";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { type DeployWorkspaceProjectContext } from "../deployWorkspaceProject/DeployWorkspaceProjectContext";
import { getDeployWorkspaceProjectResults, type DeployWorkspaceProjectResults } from "../deployWorkspaceProject/getDeployWorkspaceProjectResults";
import { type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProject/internal/DeployWorkspaceProjectInternalContext";
import { deployWorkspaceProjectInternal } from "../deployWorkspaceProject/internal/deployWorkspaceProjectInternal";
import type * as api from "./vscode-azurecontainerapps.api";

export const deployWorkspaceProjectApiCommandId: string = 'containerApps.api.deployWorkspaceProject';

export async function deployWorkspaceProjectApi(deployWorkspaceProjectOptions: api.DeployWorkspaceProjectOptionsContract): Promise<DeployWorkspaceProjectResults> {
    return await callWithTelemetryAndErrorHandling(deployWorkspaceProjectApiCommandId, async (context: IActionContext): Promise<DeployWorkspaceProjectResults> => {
        const { resourceGroupId, environmentId, newContainerAppName, rootPath, dockerfilePath, srcPath, suppressConfirmation, suppressContainerAppCreation, shouldSaveDeploySettings, suppressActivity } = deployWorkspaceProjectOptions;

        const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            selectBySubscriptionId: getSubscriptionIdFromOptions(deployWorkspaceProjectOptions),
            showLoadingPrompt: false
        });
        const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

        const rootFolder: WorkspaceFolder | undefined = rootPath ? getWorkspaceFolderFromPath(rootPath) : undefined;

        let resourceGroup: ResourceGroup | undefined;
        let managedEnvironment: ManagedEnvironment | undefined;
        if (environmentId) {
            const environmentResources = await getResourcesFromEnvironmentId({ ...context, ...subscriptionContext }, environmentId);
            resourceGroup = environmentResources.resourceGroup;
            managedEnvironment = environmentResources.managedEnvironment;
        } else if (resourceGroupId) {
            resourceGroup = await getResourceGroupFromId({ ...context, ...subscriptionContext }, resourceGroupId);
        }

        const deployWorkspaceProjectInternalContext: DeployWorkspaceProjectInternalContext = Object.assign(context, {
            ...subscriptionContext,
            subscription,
            commandId: deployWorkspaceProjectApiCommandId,
            resourceGroup,
            managedEnvironment,
            newManagedEnvironmentName: environmentId ? undefined : await tryGetNewManagedEnvironmentName({ ...context, ...subscriptionContext }, resourceGroup?.name, resourceGroup?.name),
            newContainerAppName,
            rootFolder,
            srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
            dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
            shouldSaveDeploySettings,
        });

        const deployWorkspaceProjectContext: DeployWorkspaceProjectContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, {
            suppressActivity: suppressActivity ?? true,
            suppressConfirmation,
            suppressContainerAppCreation,
            suppressProgress: true,
            suppressWizardTitle: true,
        });

        return await getDeployWorkspaceProjectResults(deployWorkspaceProjectContext);
    }) ?? {};
}

async function tryGetNewManagedEnvironmentName(context: ISubscriptionActionContext, resourceGroupName?: string, newEnvironmentName?: string): Promise<string | undefined> {
    if (!resourceGroupName || !newEnvironmentName) {
        return undefined;
    }

    if (!ManagedEnvironmentNameStep.validateInput(newEnvironmentName) && await ManagedEnvironmentNameStep.isNameAvailable(context, resourceGroupName, newEnvironmentName)) {
        return newEnvironmentName;
    }

    return undefined;
}

function getSubscriptionIdFromOptions(deployWorkspaceProjectOptions: api.DeployWorkspaceProjectOptionsContract): string | undefined {
    if (deployWorkspaceProjectOptions.subscriptionId) {
        return deployWorkspaceProjectOptions.subscriptionId;
    } else if (deployWorkspaceProjectOptions.resourceGroupId) {
        return parseAzureResourceGroupId(deployWorkspaceProjectOptions.resourceGroupId).subscriptionId;
    } else if (deployWorkspaceProjectOptions.environmentId) {
        return parseAzureResourceId(deployWorkspaceProjectOptions.environmentId).subscriptionId;
    } else {
        return undefined;
    }
}

async function getResourceGroupFromId(context: ISubscriptionActionContext, resourceGroupId: string): Promise<ResourceGroup | undefined> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    return resourceGroups.find(rg => rg.id === resourceGroupId);
}

async function getResourcesFromEnvironmentId(context: ISubscriptionActionContext, environmentId: string): Promise<{ resourceGroup: ResourceGroup | undefined, managedEnvironment: ManagedEnvironment | undefined }> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    const managedEnvironment = managedEnvironments.find(env => env.id === environmentId);

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === parseAzureResourceId(environmentId).resourceGroup);

    return {
        resourceGroup,
        managedEnvironment,
    };
}
