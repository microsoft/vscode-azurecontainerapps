/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision, ScaleRule } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";

export interface ScaleRuleItem extends ContainerAppsItem {
    scaleRule: ScaleRule;
}

export function createScaleRuleItem(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, scaleRule: ScaleRule): ScaleRuleItem {
    const parentResource = revision.name === containerApp.latestRevisionName ? containerApp : revision;

    const id = `${parentResource.id}/${scaleRule.name}`;

    return {
        id,
        subscription,
        containerApp,
        scaleRule,
        viewProperties: {
            data: scaleRule,
            label: `${parentResource.name} ${localize('scaleRule', 'Scale Rule')} ${scaleRule.name}`,
        },
        getTreeItem: (): TreeItem => ({
            id,
            label: nonNullProp(scaleRule, 'name'),
            iconPath: new ThemeIcon('dash'),
            contextValue: 'scaleRule',
            description: getDescription(scaleRule),
        }),
    };
}

function getDescription(scaleRule: ScaleRule): string {
    if (scaleRule.http) {
        return localize('http', "HTTP");
    } else if (scaleRule.azureQueue) {
        return localize('azureQueue', 'Azure Queue');
    } else if (scaleRule.custom) {
        return localize('custom', 'Custom');
    } else {
        return localize('unknown', 'Unknown');
    }
}
