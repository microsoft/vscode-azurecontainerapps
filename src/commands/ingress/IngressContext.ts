/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { IContainerAppContext } from "../IContainerAppContext";

export interface IngressContext extends IContainerAppContext, ExecuteActivityContext {
    enableIngress?: boolean;
    enableExternal?: boolean;

    targetPort?: number;
}
