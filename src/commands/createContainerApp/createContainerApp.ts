/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, ICreateChildImplContext } from "@microsoft/vscode-azext-utils";
import { rootFilter } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { ManagedEnvironmentTreeItem } from "../../tree/ManagedEnvironmentTreeItem";
import { IContainerAppContext } from "./IContainerAppContext";
import { showContainerAppCreated } from "./showContainerAppCreated";

export async function createContainerApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IContainerAppContext>, node?: ManagedEnvironmentTreeItem): Promise<ContainerAppTreeItem> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<ManagedEnvironmentTreeItem>(context, { filter: rootFilter });
    }

    const caNode: ContainerAppTreeItem = await node.createChild(context);
    void showContainerAppCreated(caNode);

    await node.refresh(context);
    return caNode;
}
