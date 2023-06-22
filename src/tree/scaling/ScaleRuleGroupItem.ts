/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision, ScaleRule } from "@azure/arm-appcontainers";
import { nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { createScaleRuleItem } from "./ScaleRuleItem";

export interface ScaleRuleGroupItem extends RevisionsItemModel {
    scaleRules: ScaleRule[];
}

export const scaleRuleGroupItemContextValue: string = 'scaleRuleGroupItem';

export function createScaleRuleGroupItem(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision): ScaleRuleGroupItem {
    const scaleRules = nonNullValueAndProp(revision.template, 'scale').rules ?? [];
    const parentResource = revision.name === containerApp.latestRevisionName ? containerApp : revision;
    const id = `${parentResource.id}/scalerules`;

    return {
        id,
        subscription,
        containerApp,
        scaleRules,
        viewProperties: {
            data: scaleRules,
            label: `${parentResource.name} Scale Rules`,
        },
        revision,
        getTreeItem: () => ({
            id,
            label: localize('scaleRules', 'Scale Rules'),
            iconPath: new ThemeIcon('symbol-constant'),
            contextValue: scaleRuleGroupItemContextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }),
        getChildren: async () => {
            return scaleRules.map(scaleRule => createScaleRuleItem(subscription, containerApp, revision, scaleRule));
        },
    };
}
