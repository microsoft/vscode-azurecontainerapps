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
import { getDeployWorkspaceProjectResults, type DeployWorkspaceProjectResults } from "../deployWorkspaceProject/getDeployWorkspaceProjectResults";
import { deployWorkspaceProjectInternal, type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProject/internal/deployWorkspaceProjectInternal";
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
            rootFolder,
            srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
            dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
            shouldSaveDeploySettings: !!shouldSaveDeploySettings,
        });

        const deployWorkspaceProjectResultContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, {
            suppressActivity: true,
            suppressConfirmation,
            suppressContainerAppCreation,
            suppressWizardTitle: true,
        });

        return await getDeployWorkspaceProjectResults(deployWorkspaceProjectResultContext);
    }) ?? {};
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
