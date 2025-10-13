/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { CopilotUserInput, type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { SharedState } from "../../webviews/OpenConfirmationViewStep";
import { deployContainerApp } from "../deployContainerApp/deployContainerApp";

export async function deployWithCopilot(context: IActionContext, node: ContainerAppItem): Promise<void> {
    context.ui = new CopilotUserInput(vscode, JSON.stringify(node.viewProperties), () => SharedState.currentPanel);
    await deployContainerApp(context, node);
}
