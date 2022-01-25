/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from "vscode";
import { IActionContext, ICreateChildImplContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { KubeEnvironmentTreeItem } from "../../tree/KubeEnvironmentTreeItem";
import { SubscriptionTreeItem } from "../../tree/SubscriptionTreeItem";
import { localize } from "../../utils/localize";
import { IKubeEnvironmentContext } from "./IKubeEnvironmentContext";

export async function createKubeEnvironment(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IKubeEnvironmentContext>, node?: SubscriptionTreeItem): Promise<KubeEnvironmentTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const keNode: KubeEnvironmentTreeItem = await node.createChild(context);
    const createdKuEnv: string = localize('createKuEnv', 'Successfully created new Container App environment "{0}".', keNode.name);
    ext.outputChannel.appendLog(createdKuEnv);
    void window.showInformationMessage(createdKuEnv);

    return keNode;
}
