/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-app";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { RevisionTreeItem } from "../../tree/RevisionTreeItem";
import { ScaleTreeItem } from "../../tree/ScaleTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";

export async function editScalingRange(context: IActionContext, node?: ScaleTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ScaleTreeItem>(new RegExp(ScaleTreeItem.contextValue), context);
    }

    const prompt: string = localize('editScalingRange', 'Set the range of application replicas that get created in response to a scale rule. Set any range within the minimum of 0 and the maximum of 10 replicas');
    const value: string = `${node.minReplicas}-${node.maxReplicas}`;
    const range = await context.ui.showInputBox({
        prompt,
        value,
        validateInput: async (value: string | undefined): Promise<string | undefined> => await validateInput(value)
    });

    const [min, max] = range.split('-').map(range => Number(range));
    const containerApp = node.parent instanceof RevisionTreeItem ? node.parent.parent.parent as ContainerAppTreeItem : node.parent as ContainerAppTreeItem;

    const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);
    const containerAppEnvelope = await containerApp.getContainerEnvelopeWithSecrets(context);
    const updating = localize('updatingRevision', 'Updating scale rule setting of "{0}" to min/max replicas of {1}-{2}...', containerApp.name, min, max);
    const updated = localize('updatedRevision', 'Updated scale rule setting of "{0}" to min/max replicas of {1}-{2}.', containerApp.name, min, max);

    containerAppEnvelope.template.scale ||= {};
    containerAppEnvelope.template.scale.minReplicas = min;
    containerAppEnvelope.template.scale.maxReplicas = max;

    await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
        ext.outputChannel.appendLog(updating);
        await appClient.containerApps.beginCreateOrUpdateAndWait(containerApp.resourceGroupName, containerApp.name, containerAppEnvelope);

        void window.showInformationMessage(updated);
        ext.outputChannel.appendLog(updated);

        await containerApp?.refresh(context);
    });
}

async function validateInput(range: string | undefined): Promise<string | undefined> {
    const formatRegex = /^\d{1,2}-\d{1,2}$/;
    if (!range || !formatRegex.test(range)) {
        return localize('enterRange', 'Please enter the range in the following format "0-10"');
    }

    const [min, max] = range.split('-').map(range => Number(range));
    if (min > 10 || max > 10) {
        return localize('maxRangeExceeded', 'The maximum number of replicas is 10.');
    } else if (min > max) {
        return localize('minHigherThanMax', 'The minimum range cannot be larger than the maximum range.');
    }

    return undefined;
}

