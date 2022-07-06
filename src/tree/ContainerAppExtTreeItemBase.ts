/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";

export abstract class ContainerAppExtTreeItemBase<T extends ContainerAppsExtResourceBase<unknown>> extends AzExtTreeItem {
    public label: string;
    public contextValue: string;

    private _includeInTreeItemPicker: boolean;
    // ideally this would be the branch provider, but that won't work right now
    treeDataProvider = ext.rgApi.appResourceTree;
    public resource: T;

    constructor(parent: AzExtParentTreeItem | undefined, resource: T) {
        super(parent);
        this.label = resource.label;
        this.id = resource.id;
        this.commandId = resource.commandId;
        this.iconPath = resource.iconPath;
        this.description = resource.description;
        this._includeInTreeItemPicker = !!resource.includeInTreeItemPicker;
        this.contextValue = resource.contextValuesToAdd?.sort().join('|') ?? '';
        this.valuesToMask.push(...resource.maskValuesToAdd);
        this.resource = resource;
    }

    public isAncestorOfImpl(): boolean {
        return this._includeInTreeItemPicker;
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        if (this.resource.deleteTreeItemImpl) return this.resource.deleteTreeItemImpl(context);
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        if (this.resource.refreshImpl) return this.resource.refreshImpl(context);
    }
}
