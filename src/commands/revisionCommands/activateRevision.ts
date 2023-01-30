/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionItem } from "../../tree/RevisionItem";
import { executeRevisionOperation } from "./changeRevisionActiveState";

export function activateRevision(context: IActionContext, node?: ContainerAppItem | RevisionItem): Promise<void> {
    return executeRevisionOperation(context, node, 'activateRevision');
}
