/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, TreeItemIconPath } from '@microsoft/vscode-azext-utils';
import { Uri } from 'vscode';
import { ext } from '../extensionVariables';

export namespace treeUtils {
    export function getIconPath(iconName: string): TreeItemIconPath {
        return Uri.joinPath(getResourcesUri(), `${iconName}.svg`);
    }

    function getResourcesUri(): Uri {
        return Uri.joinPath(ext.context.extensionUri, 'resources')
    }

    export function findNearestParent<T extends AzExtTreeItem>(node: AzExtTreeItem, parent: T): T | null {
        const parentInstance: string = parent.constructor.name;
        let foundParent: boolean = false;
        let currentNode: AzExtTreeItem = node;
        while (currentNode.parent) {
            if (currentNode.constructor.name === parentInstance) {
                foundParent = true;
                break;
            }
            currentNode = currentNode.parent;
        }
        return foundParent ? currentNode as T : null;
    }
}
