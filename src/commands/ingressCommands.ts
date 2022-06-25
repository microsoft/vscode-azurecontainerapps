/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { AzExtTreeItem, AzureWizard, AzureWizardPromptStep, IActionContext } from '@microsoft/vscode-azext-utils';
import { ProgressLocation, window } from 'vscode';
import { IngressConstants } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppExtResource } from "../resolver/ContainerAppExtResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppExtParentTreeItem } from "../tree/ContainerAppExtParentTreeItem";
import { IngressResource } from '../tree/IngressResource';
import { localize } from '../utils/localize';
import { nonNullValueAndProp } from '../utils/nonNull';
import { EnableIngressStep } from './containerApp/create/EnableIngressStep';
import { IContainerAppContext } from './containerApp/create/IContainerAppContext';
import { TargetPortStep } from './containerApp/create/TargetPortStep';
import { updateContainerApp } from "./updateContainerApp";

export async function toggleIngress(context: IActionContext, node?: ContainerAppExtParentTreeItem<IngressResource>): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker(['disabled|ingress', 'enabled|ingress'], context) as unknown as ContainerAppExtParentTreeItem<IngressResource>;
    }

    let ingress: Ingress | undefined = {};

    if (node.resource.isIngressEnabled()) {
        ingress = undefined;
    } else {
        const title: string = localize('enableIngress', 'Enable Ingress');
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new EnableIngressStep()];

        const wizardContext: IContainerAppContext = { ...context, ...node.resource.containerApp.subscriptionContext, managedEnvironmentId: node.resource.containerApp.managedEnvironmentId };
        const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps: []
        });

        wizardContext.enableIngress = true;
        await wizard.prompt();

        ingress = {
            targetPort: wizardContext.targetPort,
            external: wizardContext.enableExternal,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    "weight": 100,
                    "latestRevision": true
                }
            ],
        };
    }

    const name = node.resource.containerApp.name;
    const working = node.resource.isIngressEnabled() ?
        localize('disabling', 'Disabling ingress for container app "{0}"...', name) :
        localize('enabling', 'Enabling ingress for container app "{0}"...', name);
    const workCompleted = node.resource.isIngressEnabled() ?
        localize('disableCompleted', 'Disabled ingress for container app "{0}"', name) :
        localize('enableCompleted', 'Enabled ingress for container app "{0}"', name);

    await updateIngressSettings(context, { node, ingress, containerApp: node.resource.containerApp, working, workCompleted });
}

export async function editTargetPort(context: IActionContext, node?: ContainerAppExtParentTreeItem<IngressResource>): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker('ingress', context) as unknown as ContainerAppExtParentTreeItem<IngressResource>;
    }

    const title: string = localize('updateTargetPort', 'Update Target Port');
    const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new TargetPortStep()];

    const resource = node.resource;
    const wizardContext: IContainerAppContext = {
        ...context,
        ...resource.containerApp.subscriptionContext,
        managedEnvironmentId: resource.containerApp.managedEnvironmentId,
        defaultPort: resource.data.targetPort
    };

    const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps: []
    });

    await wizard.prompt();
    const ingress = nonNullValueAndProp(resource.containerApp.data.configuration, 'ingress');
    ingress.targetPort = wizardContext.targetPort;
    const working: string = localize('updatingTargetPort', 'Updating target port to {0}...', ingress.targetPort);
    const workCompleted: string = localize('updatedTargetPort', 'Updated target port to {0}', ingress.targetPort);
    await updateIngressSettings(context, {
        node: resource instanceof IngressResource ? node : node.parent,
        ingress, containerApp: resource.containerApp, working, workCompleted
    });
}

export async function toggleIngressVisibility(context: IActionContext, node?: ContainerAppExtParentTreeItem<ContainerAppExtResource<Ingress>>): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker('ingress', context) as unknown as ContainerAppExtParentTreeItem<ContainerAppExtResource<Ingress>>;
    }

    const resource = node.resource;

    const ingress = nonNullValueAndProp(resource.containerApp.data.configuration, 'ingress');
    const warningPrompt = localize('visibilityWarning', 'This will change the ingress visibility from "{0}" to "{1}".', ingress.external ? IngressConstants.external : IngressConstants.internal, !ingress.external ? IngressConstants.external : IngressConstants.internal)
    await context.ui.showWarningMessage(warningPrompt, { modal: true }, { title: localize('continue', 'Continue') });

    ingress.external = !ingress.external;
    const working: string = localize('updatingVisibility', 'Updating ingress visibility to "{0}"...', ingress.external ? IngressConstants.external : IngressConstants.internal);
    const workCompleted: string = localize('updatedVisibility', 'Updated ingress visibility to "{0}"', ingress.external ? IngressConstants.external : IngressConstants.internal);
    await updateIngressSettings(context, { node, ingress, containerApp: resource.containerApp, working, workCompleted });
}

async function updateIngressSettings(context: IActionContext,
    options: {
        node: AzExtTreeItem | undefined,
        ingress: Ingress | undefined,
        containerApp: ContainerAppResource,
        working: string,
        workCompleted: string
    }): Promise<void> {
    const { node, ingress, containerApp, working, workCompleted } = options;

    await window.withProgress({ location: ProgressLocation.Notification, title: working }, async (): Promise<void> => {
        ext.outputChannel.appendLog(working);
        await updateContainerApp(context, containerApp, { configuration: { ingress: ingress } })

        void window.showInformationMessage(workCompleted);
        ext.outputChannel.appendLog(workCompleted);
        await ext.rgApi.appResourceTree.refresh(context, node);
    });
}
