/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ICreateLinkerContext } from "@microsoft/vscode-azext-serviceconnector";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppModel } from "../../tree/ContainerAppItem";

export interface IServiceConnectorContext extends ICreateLinkerContext {
    containerApp: ContainerAppModel;
}

export type IServiceConnectorWithActivityContext = IServiceConnectorContext & ExecuteActivityContext;
