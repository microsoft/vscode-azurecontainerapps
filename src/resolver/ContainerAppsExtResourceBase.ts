/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { ContainerAppResource } from "./ContainerAppResource";

export abstract class ContainerAppsExtResourceBase<T> implements ResolvedAppResourceBase {
    public contextValuesToAdd: string[] = [];
    public maskValuesToAdd: string[] = [];
    public containerApp?: ContainerAppResource;

    public data?: T;
    public label: string;
    public id: string;
    public commandId?: string;
    public description?: string;
    public includeInTreeItemPicker?: boolean;

    public abstract iconPath?: TreeItemIconPath | undefined;
    public refreshImpl?(context: IActionContext): Promise<void>

    public isParent?: boolean;
    public getChildren?(context: IActionContext): Promise<ContainerAppsExtResourceBase<unknown>[]>;
    public deleteTreeItemImpl?(context: IActionContext): Promise<void>
}
