/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, ICreateChildImplContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { ResolvedContainerAppsResource } from "../../tree/ResolvedContainerAppsResource";
import { IContainerAppContext } from "./IContainerAppContext";
import { showContainerAppCreated } from "./showContainerAppCreated";

export async function createContainerApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IContainerAppContext>, node?: ResolvedContainerAppsResource): Promise<ContainerAppTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ResolvedContainerAppsResource>(ResolvedContainerAppsResource.contextValueRegExp, context);
    }

    const caNode: ContainerAppTreeItem = await node.createChild(context);
    void showContainerAppCreated(caNode);

    await node.refresh(context);
    return caNode;
}
