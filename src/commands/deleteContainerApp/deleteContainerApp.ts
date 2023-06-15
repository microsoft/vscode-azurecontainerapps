/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";

export async function deleteContainerApp(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context, {
        title: localize('deleteContainerApp', 'Delete Container App'),
    });
    await node.delete(context);
}
