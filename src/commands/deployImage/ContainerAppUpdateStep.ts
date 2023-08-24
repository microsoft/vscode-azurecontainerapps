/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../tree/ContainerAppItem";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { updateContainerApp } from "../../utils/updateContainerApp";
import type { IDeployImageContext } from "./deployImage";
import { getContainerNameForImage } from "./imageSource/containerRegistry/getContainerNameForImage";

export class ContainerAppUpdateStep extends AzureWizardExecuteStep<IDeployImageContext> {
    public priority: number = 480;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IDeployImageContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
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
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IDeployImageContext): boolean {
        return !!context.containerApp;
    }

    private initSuccessOutput(context: IDeployImageContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['containerAppUpdateStep', activitySuccessContext]),
            label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('updateContainerAppSuccess', 'Updated container app "{0}".', context.containerApp?.name);
    }

    private initFailOutput(context: IDeployImageContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['containerAppUpdateStep', activityFailContext]),
            label: localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('updateContainerAppFail', 'Failed to update container app "{0}".', context.containerApp?.name);
    }
}
