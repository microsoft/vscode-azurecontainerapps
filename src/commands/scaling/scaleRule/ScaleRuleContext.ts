/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ScaleRule } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type RevisionDraftContext } from "../../revisionDraft/RevisionDraftContext";

export interface ScaleRuleContext extends RevisionDraftContext, ExecuteActivityContext {
    scaleRule?: ScaleRule;
}
