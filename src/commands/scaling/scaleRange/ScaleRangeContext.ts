/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface ScaleRangeContext extends IContainerAppContext, ExecuteActivityContext {
    newMinRange?: number;
    newMaxRange?: number;

    scaleMinRange: number;
    scaleMaxRange: number;
}
