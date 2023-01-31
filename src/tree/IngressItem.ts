/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, Ingress } from "@azure/arm-appcontainers";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { azResourceContextValue, IngressConstants } from "../constants";
import { createGenericItem } from "../utils/GenericItem";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppModel } from "./ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";

const label: string = localize('ingress', 'Ingress');

export class IngressItem implements ContainerAppsItem {
    static contextValue: string = 'ingress|enabled';
    readonly contextValue: string = `${IngressItem.contextValue}|${azResourceContextValue}`;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel) { }

    id: string = `${this.containerApp.id}/ingress`;

    ingress: Ingress = this.containerApp.configuration?.ingress ?? {};

    viewProperties: ViewPropertiesModel = {
        data: this.ingress,
        label: `${this.containerApp.name} ${label}`,
    }

    getTreeItem(): TreeItem {
        return {
            label,
            contextValue: IngressItem.contextValue,
            iconPath: treeUtils.getIconPath('10061-icon-Virtual Networks-Networking'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const label: string = this.ingress.external ? IngressConstants.external : IngressConstants.internal;
        const description: string = this.ingress.external ? IngressConstants.externalDesc : IngressConstants.internalDesc;

        return [
            createGenericItem({
                contextValue: 'visibility',
                description,
                iconPath: new ThemeIcon('dash'),
                label,
            }),
            createGenericItem({
                contextValue: 'targetPort',
                description: String(this.ingress.targetPort),
                iconPath: new ThemeIcon('dash'),
                label: localize('targetPort', 'Target Port'),
            }),
        ];
    }
}

export class IngressDisabledItem implements TreeElementBase {
    public static contextValue: string = 'ingress|disabled';
    public readonly contextValue: string = IngressDisabledItem.contextValue;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerApp) { }

    getTreeItem(): TreeItem {
        return {
            label,
            description: localize('disabled', 'Disabled'),
            contextValue: IngressDisabledItem.contextValue,
            iconPath: new ThemeIcon('debug-disconnect'),
        }
    }
}

export function createTargetPortItem(subscription: AzureSubscription, containerApp: ContainerAppModel): ContainerAppsItem {
    return {
        subscription,
        containerApp,
        ...createGenericItem({
            label: localize('targetPort', 'Target Port'),
            contextValue: 'targetPort',
            description: String(containerApp.configuration?.ingress?.targetPort),
            iconPath: new ThemeIcon('dash'),
        }),
    };
}
