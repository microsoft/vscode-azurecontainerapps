/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { EnvironmentVariableItem } from "./EnvironmentVariableItem";

export class EnvironmentVariablesItem implements RevisionsItemModel {
    static readonly contextValue: string = 'environmentVariablesItem';
    static readonly contextValueRegExp: RegExp = new RegExp(EnvironmentVariablesItem.contextValue);

    constructor(public readonly subscription: AzureSubscription,
        public readonly containerApp: ContainerAppModel,
        public readonly revision: Revision,
        readonly containerId: string,
        readonly container: Container) {
    }
    id: string = `${this.parentResource.id}/environmentVariables/${this.container.image}`;

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('environmentVariables', 'Environment Variables'),
            iconPath: new ThemeIcon('settings'),
            contextValue: EnvironmentVariablesItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }

    getChildren(): TreeElementBase[] | undefined {
        if (!this.container.env) {
            return;
        }
        return this.container.env?.map(env => new EnvironmentVariableItem(this.subscription, this.containerApp, this.revision, this.id, this.container, env));
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }
}
