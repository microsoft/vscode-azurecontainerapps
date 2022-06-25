/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dapr } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { azResourceContextValue } from "../constants";
import { ext } from "../extensionVariables";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppExtResource } from "../resolver/ContainerAppExtResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResource } from "./IAzureResource";

export class DaprResource extends ContainerAppChildResource<Dapr> implements IAzureResource {
    public static contextValue: string = 'dapr';
    public data: Dapr;

    public label: string;
    public description: string;
    public idSuffix: string = 'dapr';

    constructor(data: Dapr | undefined, containerApp: ContainerAppResource, parentId: string) {
        super(containerApp);
        this.id = `${parentId}/${this.idSuffix}`
        this.label = localize('dapr', 'Dapr');
        this.data = data || {};
        this.description = this.data.enabled ? 'Enabled' : 'Disabled';
        this.isParent = true;

        this.contextValuesToAdd.push(DaprResource.contextValue, azResourceContextValue);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('dapr_logo');
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<undefined>[]> {
        const children: ContainerAppsExtResourceBase<undefined>[] = [];
        this.data.appId ? children.push(new ContainerAppExtResource(this.containerApp,
            { id: `${this.id}/daprAppId`, description: 'app id', label: this.data.appId, contextValuesToAdd: ['daprAppId'], maskValuesToAdd: [] })) : undefined;
        this.data.appPort ? children.push(new ContainerAppExtResource(this.containerApp,
            { id: `${this.id}/daprAppPort`, description: 'app port', label: String(this.data.appPort), contextValuesToAdd: ['daprAppPort'], maskValuesToAdd: [] })) : undefined;
        this.data.appProtocol ? children.push(new ContainerAppExtResource(this.containerApp,
            { id: `${this.id}/daprAppProtocol`, description: 'app protocol', label: String(this.data.appProtocol), contextValuesToAdd: ['daprAppProtocol'], maskValuesToAdd: [] })) : undefined;

        return children;
    }

    public async loadMoreChildrenImpl?(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        return await ext.branch.createAzExtTreeChildren(await this.getChildren(context), this as unknown as AzExtParentTreeItem);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
