/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { showContainerAppCreated } from "../createContainerApp/showContainerAppCreated";
import { getContainerNameForImage } from "../imageSource/containerRegistry/getContainerNameForImage";
import { IDeployContainerAppContext } from "./deployContainerApp";

export class ContainerAppUpdateStep extends AzureWizardExecuteStep<IDeployContainerAppContext> {
    public priority: number = 260;

    public async execute(context: IDeployContainerAppContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'targetContainer');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registries;

        // We want to replace the old image
        containerAppEnvelope.template ||= {};
        containerAppEnvelope.template.containers = [];

        containerAppEnvelope.template.containers.push({
            env: context.environmentVariables,
            image: context.image,
            name: getContainerNameForImage(nonNullProp(context, 'image')),
        });

        const creatingRevision = localize('creatingRevisionLong', 'Creating a new revision for container app "{0}"...', containerApp.name);
        progress.report({ message: creatingRevision });
        ext.outputChannel.appendLog(creatingRevision);

        await ext.state.runWithTemporaryDescription(containerApp.id, localize('creatingRevisionShort', 'Creating revision...'), async () => {
            const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
            await appClient.containerApps.beginCreateOrUpdateAndWait(containerApp.resourceGroup, containerApp.name, containerAppEnvelope);
            const updatedContainerApp = await ContainerAppItem.Get(context, context.subscription, containerApp.resourceGroup, containerApp.name);
            void showContainerAppCreated(updatedContainerApp, true);
            ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
        });
    }

    public shouldExecute(): boolean {
        return true;
    }
}
