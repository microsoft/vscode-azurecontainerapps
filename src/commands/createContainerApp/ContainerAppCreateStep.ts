/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress, RegistryCredentials, Secret, WebSiteManagementClient } from "@azure/arm-appservice";
import { Progress } from "vscode";
import { AzureWizardExecuteStep, LocationListStep } from "vscode-azureextensionui";
import { containerAppProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createWebSiteClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { listCredentialsFromRegistry } from "../deployImage/acr/listCredentialsFromRegistry";
import { getLoginServer } from "./getLoginServer";
import { IContainerAppContext } from "./IContainerAppContext";

export class ContainerAppCreateStep extends AzureWizardExecuteStep<IContainerAppContext> {
    public priority: number = 250;

    public async execute(context: IContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const webClient: WebSiteManagementClient = await createWebSiteClient(context);
        let secrets: Secret[], registries: RegistryCredentials[];

        if (context.registry) {
            // for ACR usage
            const { username, password } = await listCredentialsFromRegistry(context, context.registry);
            secrets = [
                {
                    name: password?.name,
                    value: password?.value
                }
            ]
            registries = [
                {
                    server: context.registry.loginServer,
                    username,
                    passwordSecretRef: password?.name
                }
            ]
        } else {
            // currently only supporting public Docker Hub registries so no secrets required
            secrets = [];
            registries = [];
        }

        const ingress: Ingress | undefined = context.enableIngress ? {
            targetPort: context.targetPort,
            external: context.enableExternal,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    "weight": 100,
                    "latestRevision": true
                }
            ],
        } : undefined;

        const creatingSwa: string = localize('creatingContainerApp', 'Creating new container app "{0}"...', context.newContainerAppName);
        progress.report({ message: creatingSwa });
        ext.outputChannel.appendLog(creatingSwa);

        context.containerApp = await webClient.containerApps.beginCreateOrUpdateAndWait(nonNullProp(context, 'newResourceGroupName'), nonNullProp(context, 'newContainerAppName'), {
            location: (await LocationListStep.getLocation(context, containerAppProvider)).name,
            kubeEnvironmentId: context.kubeEnvironmentId,
            configuration: {
                ingress,
                secrets,
                registries
            },
            template: {
                containers: [
                    {
                        image: `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`, name: `${context.repositoryName}-${context.tag}`
                    }
                ]
            }
        });
    }

    public shouldExecute(_wizardContext: IContainerAppContext): boolean {
        return true;
    }
}
