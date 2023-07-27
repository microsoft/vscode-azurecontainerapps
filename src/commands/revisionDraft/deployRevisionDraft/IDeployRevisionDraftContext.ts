/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Template } from "@azure/arm-appcontainers";
import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface IDeployRevisionDraftContext extends IContainerAppContext, ExecuteActivityContext {
    template: Template | undefined;
}
