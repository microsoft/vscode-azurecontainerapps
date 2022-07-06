/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ContainerAppChildResource } from "./ContainerAppChildResource";
import { ContainerAppResource } from "./ContainerAppResource";
import { ContainerAppsExtResourceBase } from "./ContainerAppsExtResourceBase";

export class ContainerAppExtResource<T> extends ContainerAppChildResource<T> {
    public name: string;
    public _iconPath?: TreeItemIconPath | undefined;
    public description?: string | undefined;

    public get iconPath(): TreeItemIconPath | undefined {
        return this._iconPath;
    }
    public set iconPath(iconPath: TreeItemIconPath | undefined) {
        this._iconPath = iconPath;
    }

    public constructor(containerApp: ContainerAppResource, resource: ContainerAppsExtResourceBase<T>) {
        super(containerApp);
        this.label = resource.label ?? '';
        this.description = resource.description;
        this._iconPath = resource.iconPath;
        this.id = resource.id;
        this.commandId = resource.commandId;
        this.containerApp = containerApp;
        this.contextValuesToAdd = resource.contextValuesToAdd;
        this.data = resource.data;
        this.iconPath = resource.iconPath;
        this.maskValuesToAdd = resource.maskValuesToAdd;
    }
}
