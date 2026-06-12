/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

/** Base type for all items in the sandboxes tree. */
export interface SandboxTreeItem {
    getTreeItem(): vscode.TreeItem;
    getChildren(): Promise<SandboxTreeItem[]>;
}
