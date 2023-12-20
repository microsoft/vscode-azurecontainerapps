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
import { localize } from "../../utils/localize";
import { getWorkspaceFolderFromPath } from "../../utils/workspaceUtils";
import { type DeployWorkspaceProjectApiOptionsContract, type DeployWorkspaceProjectResults } from "../../vscode-azurecontainerapps.api";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { deployWorkspaceProject } from "./deployWorkspaceProject";

export async function deployWorkspaceProjectApi(context: IActionContext, deployWorkspaceProjectOptions: DeployWorkspaceProjectApiOptionsContract): Promise<DeployWorkspaceProjectResults> {
    const { resourceGroupId, rootPath, srcPath, dockerfilePath, skipContainerAppCreation, shouldSaveDeploySettings } = deployWorkspaceProjectOptions;

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        selectBySubscriptionId: getSubscriptionIdFromOptions(deployWorkspaceProjectOptions),
        showLoadingPrompt: false
    });

    const subscriptionActionContext: ISubscriptionActionContext = Object.assign(context, createSubscriptionContext(subscription));

    const rootFolder: WorkspaceFolder | undefined = rootPath ? getWorkspaceFolderFromPath(rootPath) : undefined;
    const resourceGroup: ResourceGroup | undefined = resourceGroupId ? await getResourceGroupFromId(subscriptionActionContext, resourceGroupId) : undefined;

    return await deployWorkspaceProject(
        Object.assign(subscriptionActionContext, {
            subscription,
            resourceGroup,
            rootFolder,
            srcPath: srcPath ? Uri.file(srcPath).fsPath : undefined,
            dockerfilePath: dockerfilePath ? Uri.file(dockerfilePath).fsPath : undefined,
            skipContainerAppCreation,
            shouldSaveDeploySettings: !!shouldSaveDeploySettings,
            invokedFromApi: true,
        } as Partial<DeployWorkspaceProjectContext>)
    );
}

function getSubscriptionIdFromOptions(deployWorkspaceProjectOptions: DeployWorkspaceProjectApiOptionsContract): string | undefined {
    if (deployWorkspaceProjectOptions.subscriptionId) {
        return deployWorkspaceProjectOptions.subscriptionId;
    } else if (deployWorkspaceProjectOptions.resourceGroupId) {
        return parseAzureResourceGroupId(deployWorkspaceProjectOptions.resourceGroupId).subscriptionId;
    } else {
        return undefined;
    }
}

// Todo: Combine with AzureTools
function parseAzureResourceGroupId(id: string) {
    const matches: RegExpMatchArray | null = id.match(/\/subscriptions\/(.*)\/resourceGroups\/(.*)/i);

    if (!matches) {
        throw new Error(localize('invalidResourceGroupId', 'Invalid resource group ID.'));
    }

    return {
        rawId: id,
        subscriptionId: matches[1],
        resourceGroup: matches[2],
    };
}

async function getResourceGroupFromId(context: ISubscriptionActionContext, resourceGroupId: string): Promise<ResourceGroup | undefined> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    return resourceGroups.find(rg => rg.id === resourceGroupId);
}
