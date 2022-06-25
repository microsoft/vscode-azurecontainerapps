/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Scale, ScaleRule } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { ext } from "../extensionVariables";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppExtResource } from "../resolver/ContainerAppExtResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResource } from "./IAzureResource";
import { ScaleRuleGroupResource } from "./ScaleRuleGroupResource";

export class ScaleResource extends ContainerAppChildResource<Scale> implements IAzureResource {
    public static contextValue: string = 'scale';
    public data: Scale;

    public label: string;
    public description?: string | undefined;
    public minReplicas: string;
    public maxReplicas: string;

    public idSuffix: string = 'scale';

    constructor(containerApp: ContainerAppResource, data: Scale | undefined, parentId: string) {
        super(containerApp);
        this.label = localize('scale', 'Scaling');

        this.id = `${parentId}/${this.idSuffix}`;
        this.data = data || {};
        this.isParent = true;
        this.minReplicas = String(this.data.minReplicas ?? 0);
        this.maxReplicas = String(this.data.maxReplicas ?? this.data.minReplicas ?? 0);

        this.contextValuesToAdd.push(ScaleResource.contextValue, azResourceContextValue)
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('02887-icon-menu-Container-Scale');
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<ScaleRule[] | undefined>[]> {
        return [
            new ContainerAppExtResource(this.containerApp, {
                id: `${this.id}/'minmaxreplica`, label: localize('minMax', 'Min / max replicas'),
                description: `${this.minReplicas} / ${this.maxReplicas}`, contextValuesToAdd: ['minMaxReplica'],
                maskValuesToAdd: [], iconPath: new ThemeIcon('dash')
            }),
            new ScaleRuleGroupResource(this.containerApp, this.containerApp.data.template?.scale?.rules ?? [], this.id)
        ];
    }

    public async loadMoreChildrenImpl?(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        return await ext.branch.createAzExtTreeChildren((await this.getChildren(context)), this as unknown as AzExtParentTreeItem);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
