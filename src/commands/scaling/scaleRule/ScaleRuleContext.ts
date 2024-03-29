/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ScaleRule } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../IContainerAppContext";

export interface ScaleRuleContext extends IContainerAppContext, ExecuteActivityContext {
    scaleRule?: ScaleRule;
}
