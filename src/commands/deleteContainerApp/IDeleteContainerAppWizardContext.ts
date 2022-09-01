/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";

export interface IDeleteContainerAppWizardContext extends IActionContext, ExecuteActivityContext {
    containerApp: ContainerAppTreeItem;
}
