/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { rootFilter } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { RevisionTreeItem } from "../../tree/RevisionTreeItem";
import { ScaleTreeItem } from "../../tree/ScaleTreeItem";
import { localize } from "../../utils/localize";
import { updateContainerApp } from "../updateContainerApp";

export async function editScalingRange(context: IActionContext, node?: ScaleTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<ScaleTreeItem>(context, {
            filter: rootFilter,
            expectedChildContextValue: new RegExp(ScaleTreeItem.contextValue)
        });
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

    const updating = localize('updatingRevision', 'Updating scale rule setting of "{0}" to min/max replicas of {1}-{2}...', containerApp.name, min, max);
    const updated = localize('updatedRevision', 'Updated scale rule setting of "{0}" to min/max replicas of {1}-{2}.', containerApp.name, min, max);

    const template = containerApp?.data?.template || {};
    template.scale ||= {};

    template.scale.minReplicas = min;
    template.scale.maxReplicas = max;

    await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
        ext.outputChannel.appendLog(updating);
        await updateContainerApp(context, containerApp, { template })

        await containerApp?.refresh(context);
        void window.showInformationMessage(updated);
        ext.outputChannel.appendLog(updated);
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
    } else if (max === 0) {
        return localize('maxGreaterThan0', 'The maximum replicas must be greater than 0.')
    }

    return undefined;
}

