/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ContainerAppSecret } from "@azure/arm-appcontainers";
import { IActionContext, nonNullProp, parseError } from "@microsoft/vscode-azext-utils";
import { ContainerAppResource } from "../../../resolver/ContainerAppResource";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";

type Concrete<ContainerApp> = {
    [Property in keyof ContainerApp]-?: ContainerApp[Property];
}

export async function getContainerEnvelopeWithSecrets(context: IActionContext, containerApp: ContainerAppResource): Promise<Concrete<ContainerApp>> {
    // anytime you want to update the container app, you need to include the secrets but that is not retrieved by default
    // make a deep copy, we don't want to modify the one that is cached
    const containerAppEnvelope = <ContainerApp>JSON.parse(JSON.stringify(containerApp.data));

    // verify all top-level properties
    for (const key of Object.keys(containerAppEnvelope)) {
        containerAppEnvelope[key] = nonNullProp(containerAppEnvelope, <keyof ContainerApp>key);
    }

    const concreteContainerAppEnvelope = <Concrete<ContainerApp>>containerAppEnvelope;

    // https://github.com/Azure/azure-sdk-for-js/issues/21101
    // a 204 indicates no secrets, but sdk is catching it as an exception
    let secrets: ContainerAppSecret[] = [];
    try {
        const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, containerApp.subscriptionContext]);
        secrets = ((await webClient.containerApps.listSecrets(containerApp.resourceGroupName, containerApp.name)).value);
    } catch (error) {
        const pError = parseError(error);
        if (pError.errorType !== '204') {
            throw error;
        }
    }

    concreteContainerAppEnvelope.configuration.secrets = secrets;
    concreteContainerAppEnvelope.configuration.registries ||= [];

    return concreteContainerAppEnvelope;
}
