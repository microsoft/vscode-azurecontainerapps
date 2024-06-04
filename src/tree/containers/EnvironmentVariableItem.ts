/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type EnvironmentVar, type Revision } from "@azure/arm-appcontainers";
import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsItemModel } from "../revisionManagement/RevisionItem";

export class EnvironmentVariableItem implements RevisionsItemModel {
    _hideValue: boolean;
    constructor(public readonly subscription: AzureSubscription,
        public readonly containerApp: ContainerAppModel,
        public readonly revision: Revision,
        readonly containerId: string,
        readonly container: Container,
        readonly envVariable: EnvironmentVar) {
        this._hideValue = true;
    }
    id: string = `${this.containerId}/environmentVariables/${this.envVariable.name}`

    getTreeItem(): TreeItem {
        return {
            label: this._hideValue ? `${this.envVariable.name}=Hidden value. Click to view.` : `${this.envVariable.name}=${this.envVariable.value}`,
            contextValue: 'environmentVariableItem',
            iconPath: new ThemeIcon('symbol-constant'),
            command: {
                command: 'containerapps.toggleEnvironmentVariableVisibility',
                title: localize('commandtitle', 'Toggle Environment Variable Visibility'),
                arguments: [this, this._hideValue,]
            }
        }
    }

    public async toggleValueVisibility(_: IActionContext): Promise<void> {
        this._hideValue = !this._hideValue;
        ext.branchDataProvider.refresh(this);
    }
}
