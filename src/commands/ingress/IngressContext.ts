/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { IContainerAppContext } from "../IContainerAppContext";

export interface IngressContext extends IContainerAppContext, ExecuteActivityContext {
    enableIngress?: boolean;
    enableExternal?: boolean;

    targetPort?: number;
}
