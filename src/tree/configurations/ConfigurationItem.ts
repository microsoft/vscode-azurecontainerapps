/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ext } from "@microsoft/vscode-azext-github";
import { callWithTelemetryAndErrorHandling, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { ActionsItem } from "./ActionsItem";
import { DaprEnabledItem, createDaprDisabledItem } from "./DaprItem";
import { IngressDisabledItem, IngressEnabledItem } from "./IngressItem";
import { SecretsItem } from "./SecretsItem";

const configuration: string = localize('configuration', 'Configuration');

export class ConfigurationItem implements ContainerAppsItem {
    static readonly contextValue: string = 'configurationItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ConfigurationItem.contextValue);

    id: string;

    // this is called "Settings" in the Portal
    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/Configurations`;
    }

    viewProperties: ViewPropertiesModel = {
        data: nonNullProp(this.containerApp, 'configuration'),
        label: `${this.containerApp.name} ${configuration}`,
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (_context) => {
            const children: TreeElementBase[] = [];
            children.push(this.containerApp.configuration?.ingress ? new IngressEnabledItem(this.subscription, this.containerApp) : new IngressDisabledItem(this.subscription, this.containerApp));
            children.push(new SecretsItem(this.subscription, this.containerApp));
            children.push(new ActionsItem(this.id, ext.prefix, this.subscription, this.containerApp));
            children.push(this.containerApp.configuration?.dapr?.enabled ? new DaprEnabledItem(this.containerApp, this.containerApp.configuration.dapr) : createDaprDisabledItem(this.containerApp));
            return children;
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            label: localize('configurations', 'Configurations'),
            iconPath: new ThemeIcon('gear'),
            contextValue: ConfigurationItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }
}
