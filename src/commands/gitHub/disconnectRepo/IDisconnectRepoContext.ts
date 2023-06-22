/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { IGitHubContext } from "../../../gitHub/IGitHubContext";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface IDisconnectRepoContext extends IContainerAppContext, IGitHubContext, ExecuteActivityContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;
}
