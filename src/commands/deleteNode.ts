/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { azureResourceExperience, IActionContext } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType } from "@microsoft/vscode-azureresources-api";
import { ext } from '../extensionVariables';

export async function deleteNode(context: IActionContext, expectedContextValue: string | RegExp, node?: IDeletable): Promise<void> {
    node ??= await azureResourceExperience<IDeletable>(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, AzExtResourceType.ContainerAppsEnvironment, {
        include: [expectedContextValue]
    });

    if (!canDelete(node)) {
        throw new Error('Node does not support delete');
    }

    await node.delete(context);
}

export interface IDeletable {
    delete(context: IActionContext): Promise<void>;
}

function canDelete(node: unknown): node is IDeletable {
    return !!(node as IDeletable).delete;
}
