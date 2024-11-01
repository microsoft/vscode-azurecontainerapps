/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type Ingress } from "@azure/arm-appcontainers";
import { createGenericElement } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { IngressConstants } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type ContainerAppsItem, type TreeElementBase } from "../ContainerAppsBranchDataProvider";

const label: string = localize('ingress', 'Ingress');

const targetPortItemContextValue: string = 'targetPortItem';
const visibilityItemContextValue: string = 'visibilityItem';

export class IngressEnabledItem implements ContainerAppsItem {
    static readonly contextValue: string = 'ingressEnabledItem';
    static readonly contextValueRegExp: RegExp = new RegExp(IngressEnabledItem.contextValue);

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel) { }

    id: string = `${this.containerApp.id}/ingress`;

    ingress: Ingress = this.containerApp.configuration?.ingress ?? {};

    viewProperties: ViewPropertiesModel = {
        getData: () => Promise.resolve(
            (ext.viewPropertiesResourceCache.get(this.containerApp.id) as ContainerAppModel)?.configuration?.ingress ??
            this.ingress ??
            {}
        ),
        label: `${this.containerApp.name} ${label}`,
    }

    getTreeItem(): TreeItem {
        return {
            label,
            contextValue: IngressEnabledItem.contextValue,
            iconPath: treeUtils.getIconPath('virtual-network'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const label: string = this.ingress.external ? IngressConstants.external : IngressConstants.internal;
        const description: string = this.ingress.external ? IngressConstants.externalDesc : IngressConstants.internalDesc;

        const targetPortItem: TreeElementBase & ContainerAppsItem = {
            containerApp: this.containerApp,
            subscription: this.subscription,
            ...createGenericElement({
                contextValue: targetPortItemContextValue,
                description: String(this.ingress.targetPort),
                iconPath: new ThemeIcon('dash'),
                label: localize('targetPort', 'Target Port'),
            }),
        };

        return [
            createGenericElement({
                contextValue: visibilityItemContextValue,
                description,
                iconPath: new ThemeIcon('dash'),
                label,
            }),
            targetPortItem,
        ];
    }
}

export class IngressDisabledItem implements TreeElementBase {
    static readonly contextValue: string = 'ingressDisabledItem';
    static readonly contextValueRegExp: RegExp = new RegExp(IngressDisabledItem.contextValue);

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
        ...createGenericElement({
            label: localize('targetPort', 'Target Port'),
            contextValue: targetPortItemContextValue,
            description: String(containerApp.configuration?.ingress?.targetPort),
            iconPath: new ThemeIcon('dash'),
        }),
    };
}
