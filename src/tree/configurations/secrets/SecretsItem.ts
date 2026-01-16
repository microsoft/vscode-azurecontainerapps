/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Secret } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { localize } from "../../../utils/localize";
import { treeUtils } from "../../../utils/treeUtils";
import { type ContainerAppModel } from "../../ContainerAppItem";
import { type ContainerAppsItem, type TreeElementBase } from "../../ContainerAppsBranchDataProvider";
import { SecretItem } from "./SecretItem";

const secrets: string = localize('secrets', 'Secrets');

export class SecretsItem implements ContainerAppsItem {
    static readonly idSuffix: string = 'secrets';
    static readonly contextValue: string = 'secretsItem';
    static readonly contextValueRegExp: RegExp = new RegExp(SecretsItem.contextValue);
    id: string;
    viewProperties: ViewPropertiesModel;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/${SecretsItem.idSuffix}`;
        this.viewProperties = {
            data: containerApp.configuration?.secrets ?? [],
            label: `${containerApp.name} ${secrets}`,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const secrets: Secret[] = this.containerApp.configuration?.secrets ?? [];
        return secrets
            .map((secret) => new SecretItem(this.subscription, this.containerApp, nonNullProp(secret, 'name')))
            .sort((a, b) => treeUtils.sortById(a, b));
    }

    getTreeItem(): TreeItem {
        return {
            label: secrets,
            iconPath: treeUtils.getIconPath('secrets'),
            contextValue: SecretsItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        };
    }
}
