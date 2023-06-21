/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { IGitHubContext } from "../../../gitHub/IGitHubContext";
import { ContainerAppModel } from "../../../tree/ContainerAppItem";
import { IContainerAppContext } from "../../IContainerAppContext";

// export type IDisconnectRepoContext = IContainerAppContext & { containerApp} & IGitHubContext & ExecuteActivityContext;

export interface IDisconnectRepoContext extends IContainerAppContext, IGitHubContext, ExecuteActivityContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;
}
