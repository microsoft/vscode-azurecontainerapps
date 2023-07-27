/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Template } from "@azure/arm-appcontainers";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { IContainerAppContext } from "../../IContainerAppContext";

export interface IDeployRevisionDraftContext extends IContainerAppContext, ExecuteActivityContext {
    baseRevisionName: string;
    template: Template;
}
