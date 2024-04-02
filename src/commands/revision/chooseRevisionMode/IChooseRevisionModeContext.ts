/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../IContainerAppContext";

export interface IChooseRevisionModeContext extends IContainerAppContext, ExecuteActivityContext {
    newRevisionMode?: KnownActiveRevisionsMode;

    hasRevisionDraft: boolean;
}
