/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { createSubscriptionContext, subscriptionExperience, type IActionContext, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { Uri, type WorkspaceFolder } from "vscode";
import { ext } from "../../extensionVariables";
import { getWorkspaceFolderFromPath } from "../../utils/workspaceUtils";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { deployWorkspaceProject, type DeployWorkspaceProjectResults } from "./deployWorkspaceProject";

interface DeployWorkspaceProjectApiOptionsContract {
    // Existing resources
    resourceGroupId?: string;

    // Workspace deployment paths
    rootPath?: string;
    srcPath?: string;
    dockerfilePath?: string;

    // Options
    skipContainerAppCreation?: boolean;
    shouldSaveDeploySettings?: boolean;
}

export async function deployWorkspaceProjectApi(context: IActionContext, deployWorkspaceProjectOptions: DeployWorkspaceProjectApiOptionsContract): Promise<DeployWorkspaceProjectResults> {
    const { resourceGroupId, rootPath, srcPath, dockerfilePath, skipContainerAppCreation, shouldSaveDeploySettings } = deployWorkspaceProjectOptions;

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionActionContext: ISubscriptionActionContext = Object.assign(context, createSubscriptionContext(subscription));

    const rootFolder: WorkspaceFolder | undefined = rootPath ? getWorkspaceFolderFromPath(rootPath) : undefined;
    const resourceGroup: ResourceGroup | undefined = resourceGroupId ? await getResourceGroupFromId(subscriptionActionContext, resourceGroupId) : undefined;

    return await deployWorkspaceProject(
        Object.assign(subscriptionActionContext, {
            resourceGroup,
            rootFolder,
            srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
            dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
            skipContainerAppCreation,
            shouldSaveDeploySettings: !!shouldSaveDeploySettings,
            apiEntryPoint: true,
        } as Partial<DeployWorkspaceProjectContext>)
    );
}

async function getResourceGroupFromId(context: ISubscriptionActionContext, resourceGroupId: string): Promise<ResourceGroup | undefined> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    return resourceGroups.find(rg => rg.id === resourceGroupId);
}
