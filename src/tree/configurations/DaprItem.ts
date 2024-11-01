/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type Dapr } from "@azure/arm-appcontainers";
import { createGenericElement } from "@microsoft/vscode-azext-utils";
import { type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type TreeElementBase } from "../ContainerAppsBranchDataProvider";

const daprDisabledItemContextValue: string = 'daprDisabledItem';
const daprAppIdItemContextValue: string = 'daprAppIdItem';
const daprAppPortItemContextValue: string = 'daprAppPortItem';
const daprAppProtocolItemContextValue: string = 'daprAppProtocolItem';

export class DaprEnabledItem implements TreeElementBase {
    static readonly contextValue: string = 'daprEnabledItem';
    static readonly contextValueRegExp: RegExp = new RegExp(DaprEnabledItem.contextValue);

    constructor(private readonly containerApp: ContainerAppModel, private readonly dapr: Dapr) { }

    id: string = `${this.containerApp.id}/DaprEnabled`;

    viewProperties: ViewPropertiesModel = {
        getData: () => Promise.resolve((ext.resourceCache.get(this.containerApp.id) as ContainerAppModel)?.configuration?.dapr ?? this.dapr),
        label: localize('daprProperties', '{0} Dapr', this.containerApp.name),
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('dapr', 'Dapr'),
            contextValue: DaprEnabledItem.contextValue,
            description: localize('enabled', 'Enabled'),
            iconPath: treeUtils.getIconPath('dapr'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const children: TreeElementBase[] = [];

        if (this.dapr.appId) {
            children.push(createGenericElement({
                contextValue: daprAppIdItemContextValue,
                description: 'app id',
                iconPath: new ThemeIcon('dash'),
                label: this.dapr.appId,
            }));
        }

        if (this.dapr.appPort) {
            children.push(createGenericElement({
                contextValue: daprAppPortItemContextValue,
                description: 'app port',
                iconPath: new ThemeIcon('dash'),
                label: String(this.dapr.appPort),
            }))
        }

        if (this.dapr.appProtocol) {
            children.push(createGenericElement({
                description: daprAppProtocolItemContextValue,
                label: String(this.dapr.appProtocol),
                contextValue: 'daprAppProtocol',
                iconPath: new ThemeIcon('dash'),
            }));
        }

        return children;
    }
}

export function createDaprDisabledItem(containerApp: ContainerApp): TreeElementBase {
    return createGenericElement({
        id: `${containerApp.id}/DaprDisabled`,
        label: localize('dapr', 'Dapr'),
        description: localize('disabled', 'Disabled'),
        contextValue: daprDisabledItemContextValue,
        iconPath: new ThemeIcon('debug-disconnect'),
    });
}
