/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../utils/localize";
import { ContainerAppModel } from "./ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";
import { DaprEnabledItem, createDaprDisabledItem } from "./DaprItem";
import { IngressDisabledItem, IngressItem } from "./IngressItem";
import { ActionsTreeItem } from "./gitHub/ActionsTreeItem";

export class ConfigurationItem implements ContainerAppsItem {
    id: string;

    // this is called "Settings" in the Portal
    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/Configurations`;
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (_context) => {
            const children: TreeElementBase[] = [];
            children.push(this.containerApp.configuration?.ingress ? new IngressItem(this.subscription, this.containerApp) : new IngressDisabledItem(this.subscription, this.containerApp));
            children.push(this.containerApp.configuration?.dapr?.enabled ? new DaprEnabledItem(this.containerApp, this.containerApp.configuration.dapr) : createDaprDisabledItem(this.containerApp));
            children.push(new ActionsTreeItem(this.subscription, this.containerApp));
            // We should add secrets/registries here when we support it
            return children;
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            label: localize('configurations', 'Configurations'),
            iconPath: new ThemeIcon('gear'),
            contextValue: 'configurations',
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }
}