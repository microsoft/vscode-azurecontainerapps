/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { type DefaultContainerAppsResources } from "./getDefaultContainerAppsResources";
import { getResourcesFromManagedEnvironmentHelper } from "./getResourceHelpers";

/**
 * Prompts the user to select or create a container apps environment and retrieves any resource group associated with it.
 * A returned resource of `undefined` indicates that the resource required does not currently exist and must be created later.
 */
export async function promptForEnvironmentResources(context: ISubscriptionActionContext & Partial<DeployWorkspaceProjectContext>): Promise<DefaultContainerAppsResources> {
    // Define a default object ahead of time to represent the case for no matching environments found
    const noMatchingEnvironmentResources: DefaultContainerAppsResources = {
        resourceGroup: context.resourceGroup,
        managedEnvironment: undefined,
    };

    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(
        context.resourceGroup ?
            client.managedEnvironments.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
            client.managedEnvironments.listBySubscription()
    );

    if (!managedEnvironments.length) {
        return noMatchingEnvironmentResources;
    }

    const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = [
        {
            label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
            description: '',
            data: undefined
        },
        ...managedEnvironments.map(env => {
            return {
                label: nonNullProp(env, 'name'),
                description: '',
                data: env
            };
        })
    ];

    context.telemetry.properties.promptedForEnvironment = 'true';

    const placeHolder: string = localize('selectManagedEnvironment', 'Select a container apps environment');
    const managedEnvironment: ManagedEnvironment | undefined = (await context.ui.showQuickPick(picks, { placeHolder })).data;

    if (!managedEnvironment) {
        return noMatchingEnvironmentResources;
    }

    return await getResourcesFromManagedEnvironmentHelper(context, managedEnvironment);
}
