/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment, type RegistryCredentials } from "@azure/arm-appcontainers";
import { type Registry, type RegistryPassword } from "@azure/arm-containerregistry";
import { type Workspace } from "@azure/arm-operationalinsights";
import { type ResourceGroup } from "@azure/arm-resources";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../tree/ContainerAppItem";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { listCredentialsFromAcr } from "../registryCredentials/dockerLogin/listCredentialsFromAcr";

export interface DeployContainerAppResultsContext extends ISubscriptionActionContext {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    logAnalyticsWorkspace?: Workspace;
    containerApp?: ContainerAppModel;
    registry?: Registry;
    image?: string;
}

export interface DeployContainerAppResults {
    resourceGroupId?: string;
    logAnalyticsWorkspaceId?: string;
    managedEnvironmentId?: string;
    containerAppId?: string;
    registryId?: string;
    registryLoginServer?: string;
    registryUsername?: string;
    registryPassword?: string;
    imageName?: string;
}

export async function getDeployContainerAppResults(context: DeployContainerAppResultsContext): Promise<DeployContainerAppResults> {
    const registryCredentials: RegistryCredentials | undefined = context.containerApp?.configuration?.registries?.find(r => r.server === context.registry?.loginServer);

    let listedCredentials: { username: string, password: RegistryPassword } | undefined;
    if (!registryCredentials?.identity) {
        listedCredentials = await listCredentialsFromAcr(context);
    }

    context.logAnalyticsWorkspace ??= await tryGetLogAnalyticsWorkspace(context);

    return {
        resourceGroupId: context.resourceGroup?.id,
        logAnalyticsWorkspaceId: context.logAnalyticsWorkspace?.id,
        managedEnvironmentId: context.managedEnvironment?.id,
        containerAppId: context.containerApp?.id,
        registryId: context.registry?.id,
        registryLoginServer: context.registry?.loginServer,
        registryUsername: listedCredentials?.username,
        registryPassword: listedCredentials?.password.value,
        imageName: context.image,
    };
}

export async function tryGetLogAnalyticsWorkspace(context: DeployContainerAppResultsContext): Promise<Workspace | undefined> {
    const resourceGroupName = context.resourceGroup?.name;
    const logAnalyticsCustomerId = context.managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;

    if (!resourceGroupName || !logAnalyticsCustomerId) {
        return undefined;
    }

    const client = await createOperationalInsightsManagementClient(context);
    const workspaces: Workspace[] = await uiUtils.listAllIterator(client.workspaces.listByResourceGroup(resourceGroupName));
    return workspaces.find(w => w.customerId === logAnalyticsCustomerId);
}
