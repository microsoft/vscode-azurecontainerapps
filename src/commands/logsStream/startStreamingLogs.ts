/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { pickContainerApp } from "../../utils/pickContainerApp";

export async function startStreamingLogs(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        node = await pickContainerApp(context);
    }
}
