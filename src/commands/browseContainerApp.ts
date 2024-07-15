/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp } from '@azure/arm-appcontainers';
import { type AuthorizationManagementClient, type RoleAssignmentCreateParameters } from '@azure/arm-authorization';
import { createSubscriptionContext, nonNullValueAndProp, openUrl, subscriptionExperience, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as crypto from "crypto";
import { ext } from '../extensionVariables';
import { isIngressEnabled, type ContainerAppItem } from '../tree/ContainerAppItem';
import { createAuthorizationManagementClient } from '../utils/azureClients';
import { localize } from '../utils/localize';
import { type IContainerAppContext } from './IContainerAppContext';

export async function browseContainerAppNode(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const containerApp = nonNullValueAndProp(node, 'containerApp');

    const wizardContext: IContainerAppContext = {
        ...context,
        ...subscriptionContext,
        subscription,
        containerApp,
    }

    // await updateContainerApp(context, subscription, containerApp, {
    //     identity: {
    //         type: "SystemAssigned",
    //     }
    // });

    const client: AuthorizationManagementClient = await createAuthorizationManagementClient(wizardContext);

    const acrPullId: string = 'f951dda-4ed3-4680-a7ca-43fe172d538d';
    const roleCreateParams: RoleAssignmentCreateParameters = {
        description: 'acr pull',
        roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullId}`,
        principalId: "0453c286-33b4-42ce-b1cc-e8dbc0354f75", // The system assigned managed identity
    }

    const res = await client.roleAssignments.create(
        '/subscriptions/xxxxx/resourceGroups/mwf-mi/providers/Microsoft.ContainerRegistry/registries/mwfmi501bcf',
        crypto.randomUUID(),
        roleCreateParams,
    );

    console.log(res);
}

export async function browseContainerApp(containerApp: ContainerApp): Promise<void> {
    if (isIngressEnabled(containerApp)) {
        return await openUrl(`https://${containerApp.configuration.ingress.fqdn}`);
    }

    throw new Error(localize('enableIngress', 'Enable ingress to perform this action.'));
}
