/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { IContainerAppContext } from "../../IContainerAppContext";
import { ISecretContext } from "../../secret/ISecretContext";

export interface IDeleteScaleRuleContext extends IContainerAppContext, ISecretContext, ExecuteActivityContext {
    scaleRule?: ScaleRule;
}
