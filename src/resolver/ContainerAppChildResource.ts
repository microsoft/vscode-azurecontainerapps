/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ContainerAppResource } from "./ContainerAppResource";
import { ContainerAppsExtResourceBase } from "./ContainerAppsExtResourceBase";

export abstract class ContainerAppChildResource<T> extends ContainerAppsExtResourceBase<T> {
    public name: string;
    public containerApp: ContainerAppResource;

    public abstract description?: string | undefined;
    public abstract iconPath: TreeItemIconPath | undefined;

    public constructor(containerApp: ContainerAppResource) {
        super();
        this.containerApp = containerApp;
    }
}
