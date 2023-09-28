/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { showContainerAppCreated } from "../../commands/createContainerApp/showContainerAppCreated";
import { ImageSourceBaseContext } from "../../commands/image/imageSource/ImageSourceBaseContext";
import { getContainerNameForImage } from "../../commands/image/imageSource/containerRegistry/getContainerNameForImage";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import { updateContainerApp } from "./updateContainerApp";

export class ContainerAppUpdateStep<T extends ImageSourceBaseContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 650;

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
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
            await updateContainerApp(context, context.subscription, containerAppEnvelope);
            const updatedContainerApp = await ContainerAppItem.Get(context, context.subscription, containerApp.resourceGroup, containerApp.name);
            void showContainerAppCreated(updatedContainerApp, true);
            ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
        });
    }

    public shouldExecute(): boolean {
        return true;
    }
}
