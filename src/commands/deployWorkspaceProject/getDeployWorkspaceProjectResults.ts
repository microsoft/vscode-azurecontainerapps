/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryPassword } from "@azure/arm-containerregistry";
import { type Workspace } from "@azure/arm-operationalinsights";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import type * as api from "../api/vscode-azurecontainerapps.api";
import { listCredentialsFromAcr } from "../registryCredentials/dockerLogin/listCredentialsFromAcr";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";

export type DeployWorkspaceProjectResults = api.DeployWorkspaceProjectResults;

export async function getDeployWorkspaceProjectResults(context: DeployWorkspaceProjectContext): Promise<DeployWorkspaceProjectResults> {
    const registryCredentials: { username: string, password: RegistryPassword } | undefined = context.registry ?
        await listCredentialsFromAcr(context) : undefined;

    context.logAnalyticsWorkspace ??= await tryGetLogAnalyticsWorkspace(context);

    return {
        resourceGroupId: context.resourceGroup?.id,
        logAnalyticsWorkspaceId: context.logAnalyticsWorkspace?.id,
        managedEnvironmentId: context.managedEnvironment?.id,
        containerAppId: context.containerApp?.id,
        registryId: context.registry?.id,
        registryLoginServer: context.registry?.loginServer,
        registryUsername: registryCredentials?.username,
        registryPassword: registryCredentials?.password.value,
        imageName: context.imageName
    };
}

export async function tryGetLogAnalyticsWorkspace(context: DeployWorkspaceProjectContext): Promise<Workspace | undefined> {
    const resourceGroupName = context.resourceGroup?.name;
    const logAnalyticsCustomerId = context.managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;

    if (!resourceGroupName || !logAnalyticsCustomerId) {
        return undefined;
    }

    const client = await createOperationalInsightsManagementClient(context);
    const workspaces: Workspace[] = await uiUtils.listAllIterator(client.workspaces.listByResourceGroup(resourceGroupName));
    return workspaces.find(w => w.customerId === logAnalyticsCustomerId);
}
