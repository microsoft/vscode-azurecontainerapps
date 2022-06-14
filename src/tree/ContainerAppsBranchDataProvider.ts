/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeDataProvider, AzExtTreeItem, IActionContext, IFindTreeItemContext, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { Disposable, Event, TreeItem, TreeView } from "vscode";

export class ContainerAppsBranchDataProvider implements AzExtTreeDataProvider {
    public onDidChangeTreeData: Event<AzExtTreeItem | undefined>;
    public onTreeItemCreate: Event<AzExtTreeItem>;
    public onDidExpandOrRefreshExpandedTreeItem: Event<AzExtTreeItem>;
    public getTreeItem(_treeItem: AzExtTreeItem): TreeItem {
        throw new Error("Method not implemented.");
    }
    public getChildren(_treeItem?: AzExtParentTreeItem | undefined): Promise<AzExtTreeItem[]> {
        throw new Error("Method not implemented.");
    }
    public refresh(_context: IActionContext, _treeItem?: AzExtTreeItem | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public refreshUIOnly(_treeItem: AzExtTreeItem | undefined): void {
        throw new Error("Method not implemented.");
    }
    public loadMore(_treeItem: AzExtTreeItem, _context: IActionContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public showTreeItemPicker<T extends AzExtTreeItem>(expectedContextValues: string | RegExp | (string | RegExp)[], context: ITreeItemPickerContext & { canPickMany: true; }, startingTreeItem?: AzExtTreeItem | undefined): Promise<T[]>;
    public showTreeItemPicker<T extends AzExtTreeItem>(expectedContextValues: string | RegExp | (string | RegExp)[], context: ITreeItemPickerContext, startingTreeItem?: AzExtTreeItem | undefined): Promise<T>;
    public showTreeItemPicker(_expectedContextValues: unknown, _context: unknown, _startingTreeItem?: unknown): Promise<T[]> | Promise<T> {
        throw new Error("Method not implemented.");
    }
    public findTreeItem<T extends AzExtTreeItem>(_fullId: string, _context: IFindTreeItemContext): Promise<T | undefined> {
        throw new Error("Method not implemented.");
    }
    public getParent(_treeItem: AzExtTreeItem): Promise<AzExtTreeItem | undefined> {
        throw new Error("Method not implemented.");
    }
    public trackTreeItemCollapsibleState(_treeView: TreeView<AzExtTreeItem>): Disposable {
        throw new Error("Method not implemented.");
    }
}
