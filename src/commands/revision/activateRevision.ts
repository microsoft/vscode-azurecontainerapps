/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IActionContext } from "@microsoft/vscode-azext-utils";
import type { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { executeRevisionOperation } from "./changeRevisionActiveState";

export function activateRevision(context: IActionContext, node?: RevisionItem): Promise<void> {
    return executeRevisionOperation(context, node, 'activateRevision');
}
