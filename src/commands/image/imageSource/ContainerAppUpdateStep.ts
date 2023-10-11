/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import type { ImageSourceBaseContext } from "./ImageSourceBaseContext";
import { getContainerNameForImage } from "./containerRegistry/getContainerNameForImage";

export class ContainerAppUpdateStep<T extends ImageSourceBaseContext> extends ExecuteActivityOutputStepBase<T> {
    public priority: number = 480;

    protected async executeCore(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

        const updating = localize('updatingContainerApp', 'Updating container app...', containerApp.name);
        progress.report({ message: updating });

        await ext.state.runWithTemporaryDescription(containerApp.id, localize('updating', 'Updating...'), async () => {
            await updateContainerApp(context, context.subscription, containerAppEnvelope);
            ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
        });
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    protected createSuccessOutput(context: T): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppUpdateStep', activitySuccessContext]),
                label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('updateContainerAppSuccess', 'Updated container app "{0}".', context.containerApp?.name)
        };
    }

    protected createFailOutput(context: T): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppUpdateStep', activityFailContext]),
                label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('updateContainerAppFail', 'Failed to update container app "{0}".', context.containerApp?.name)
        };
    }
}
