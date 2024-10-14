/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type RevisionDraftContext } from "../../revisionDraft/RevisionDraftContext";

export interface ScaleRangeContext extends RevisionDraftContext, ExecuteActivityContext {
    newMinRange?: number;
    newMaxRange?: number;

    scaleMinRange: number;
    scaleMaxRange: number;
}
