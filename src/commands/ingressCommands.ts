/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardPromptStep, GenericTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ProgressLocation, window } from 'vscode';
import { IngressConstants } from '../constants';
import { ext } from '../extensionVariables';
import { IngressDisabledTreeItem, IngressTreeItem } from '../tree/IngressTreeItem';
import { localize } from '../utils/localize';
import { nonNullValueAndProp } from '../utils/nonNull';
import { EnableIngressStep } from './createContainerApp/EnableIngressStep';
import { IContainerAppContext } from './createContainerApp/IContainerAppContext';
import { TargetPortStep } from './createContainerApp/TargetPortStep';
import { updateContainerApp } from "./updateContainerApp";

export async function toggleIngress(context: IActionContext, node?: IngressTreeItem | IngressDisabledTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<IngressTreeItem | IngressDisabledTreeItem>([IngressTreeItem.contextValue, IngressDisabledTreeItem.contextValue], context);
    }

    let ingress: Ingress | null = {};

    if (node instanceof IngressTreeItem) {
        // PATCH requires ingress be set to null exclusively to be picked up since undefined means there was no update
        ingress = null;
    } else {
        const title: string = localize('enableIngress', 'Enable Ingress');
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new EnableIngressStep()];

        const wizardContext: IContainerAppContext = { ...context, ...node.subscription, managedEnvironmentId: node.parent.managedEnvironmentId };
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

    const name = node.parent.name;
    const working = node instanceof IngressTreeItem ? localize('disabling', 'Disabling ingress for container app "{0}"...', name) : localize('enabling', 'Enabling ingress for container app "{0}"...', name);
    const workCompleted = node instanceof IngressTreeItem ? localize('disableCompleted', 'Disabled ingress for container app "{0}"', name) : localize('enableCompleted', 'Enabled ingress for container app "{0}"', name);

    await updateIngressSettings(context, { ingress, node, working, workCompleted });
}

export async function editTargetPort(context: IActionContext, target?: IngressTreeItem | GenericTreeItem): Promise<void> {
    if (!target) {
        target = await ext.tree.showTreeItemPicker<IngressTreeItem>(IngressTreeItem.contextValue, context);
    }

    // GenericTreeItem will be a targetPort node
    const node: IngressTreeItem = target instanceof IngressTreeItem ? target : target.parent as IngressTreeItem;

    const title: string = localize('updateTargetPort', 'Update Target Port');
    const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new TargetPortStep()];

    const wizardContext: IContainerAppContext = {
        ...context,
        ...node.subscription,
        managedEnvironmentId: node.parent.managedEnvironmentId,
        defaultPort: node.data.targetPort
    };

    const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps: []
    });

    await wizard.prompt();
    const ingress = nonNullValueAndProp(node.parent.data.configuration, 'ingress');
    ingress.targetPort = wizardContext.targetPort;
    const working: string = localize('updatingTargetPort', 'Updating target port to {0}...', ingress.targetPort);
    const workCompleted: string = localize('updatedTargetPort', 'Updated target port to {0}', ingress.targetPort);
    await updateIngressSettings(context, { ingress, node, working, workCompleted });
}

export async function toggleIngressVisibility(context: IActionContext, node?: IngressTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<IngressTreeItem>(IngressTreeItem.contextValue, context);
    }

    const ingress = nonNullValueAndProp(node.parent.data.configuration, 'ingress');
    const warningPrompt = localize('visibilityWarning', 'This will change the ingress visibility from "{0}" to "{1}".', ingress.external ? IngressConstants.external : IngressConstants.internal, !ingress.external ? IngressConstants.external : IngressConstants.internal)
    await context.ui.showWarningMessage(warningPrompt, { modal: true }, { title: localize('continue', 'Continue') });

    ingress.external = !ingress.external;
    const working: string = localize('updatingVisibility', 'Updating ingress visibility to "{0}"...', ingress.external ? IngressConstants.external : IngressConstants.internal);
    const workCompleted: string = localize('updatedVisibility', 'Updated ingress visibility to "{0}"', ingress.external ? IngressConstants.external : IngressConstants.internal);
    await updateIngressSettings(context, { ingress, node, working, workCompleted });
}

async function updateIngressSettings(context: IActionContext,
    options: {
        ingress: Ingress | undefined,
        node: IngressTreeItem | IngressDisabledTreeItem,
        working: string,
        workCompleted: string
    }): Promise<void> {
    const { ingress, node, working, workCompleted } = options;

    await window.withProgress({ location: ProgressLocation.Notification, title: working }, async (): Promise<void> => {
        ext.outputChannel.appendLog(working);
        await updateContainerApp(context, node.parent, { configuration: { ingress: ingress } })

        void window.showInformationMessage(workCompleted);
        ext.outputChannel.appendLog(workCompleted);
    });

    await node.parent.refresh(context);
}
