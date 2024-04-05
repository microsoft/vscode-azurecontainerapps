/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, parseAzureResourceGroupId } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, subscriptionExperience, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { Uri, type WorkspaceFolder } from "vscode";
import { ext } from "../../extensionVariables";
import { getWorkspaceFolderFromPath } from "../../utils/workspaceUtils";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { type DeployWorkspaceProjectContext } from "../deployWorkspaceProject/DeployWorkspaceProjectContext";
import { getDeployWorkspaceProjectResults, type DeployWorkspaceProjectResults } from "../deployWorkspaceProject/getDeployWorkspaceProjectResults";
import { type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProject/internal/DeployWorkspaceProjectInternalContext";
import { deployWorkspaceProjectInternal } from "../deployWorkspaceProject/internal/deployWorkspaceProjectInternal";
import type * as api from "./vscode-azurecontainerapps.api";

export async function deployWorkspaceProjectApi(deployWorkspaceProjectOptions: api.DeployWorkspaceProjectOptionsContract): Promise<DeployWorkspaceProjectResults> {
    return await callWithTelemetryAndErrorHandling('containerApps.api.deployWorkspaceProject', async (context: IActionContext): Promise<DeployWorkspaceProjectResults> => {
        const { resourceGroupId, rootPath, dockerfilePath, srcPath, suppressConfirmation, suppressContainerAppCreation, shouldSaveDeploySettings } = deployWorkspaceProjectOptions;

        const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            selectBySubscriptionId: getSubscriptionIdFromOptions(deployWorkspaceProjectOptions),
            showLoadingPrompt: false
        });
        const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

        const rootFolder: WorkspaceFolder | undefined = rootPath ? getWorkspaceFolderFromPath(rootPath) : undefined;
        const resourceGroup: ResourceGroup | undefined = resourceGroupId ? await getResourceGroupFromId({ ...context, ...subscriptionContext }, resourceGroupId) : undefined;

        const deployWorkspaceProjectInternalContext: DeployWorkspaceProjectInternalContext = Object.assign(context, {
            ...subscriptionContext,
            subscription,
            resourceGroup,
            newManagedEnvironmentName: await tryGetNewManagedEnvironmentName({ ...context, ...subscriptionContext }, resourceGroup?.name, resourceGroup?.name),
            rootFolder,
            srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
            dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
            shouldSaveDeploySettings: !!shouldSaveDeploySettings,
        });

        const deployWorkspaceProjectContext: DeployWorkspaceProjectContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, {
            suppressActivity: true,
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
        return parseAzureResourceGroupId(deployWorkspaceProjectOptions.resourceGroupId).subscriptionId as string;
    } else {
        return undefined;
    }
}

async function getResourceGroupFromId(context: ISubscriptionActionContext, resourceGroupId: string): Promise<ResourceGroup | undefined> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    return resourceGroups.find(rg => rg.id === resourceGroupId);
}
