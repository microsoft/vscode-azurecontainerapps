/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { ext } from '../extensionVariables';
import { type TreeElementBase } from '../tree/ContainerAppsBranchDataProvider';

export namespace treeUtils {
    export function getIconPath(iconName: string): Uri {
        return Uri.joinPath(getResourcesUri(), `${iconName}.svg`);
    }

    function getResourcesUri(): Uri {
        return Uri.joinPath(ext.context.extensionUri, 'resources')
    }

    export function sortById(a: TreeElementBase, b: TreeElementBase): number {
        return a.id && b.id ? a.id.localeCompare(b.id) : 0;
    }
}
