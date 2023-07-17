/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Secret } from "@azure/arm-appcontainers";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem } from "vscode";
import type { ContainerAppModel } from "../../ContainerAppItem";
import type { ContainerAppsItem } from "../../ContainerAppsBranchDataProvider";
import { SecretsItem } from "./SecretsItem";

export class SecretItem implements ContainerAppsItem {
    static readonly contextValue: string = 'secretItem';
    static readonly contextValueRegExp: RegExp = new RegExp(SecretItem.contextValue);

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly secret: Secret) { }

    id: string = `${this.containerApp.id}/${SecretsItem.idSuffix}/${this.secret.name}`;

    getTreeItem(): TreeItem {
        return {
            label: this.secret.name,
            iconPath: new ThemeIcon('key'),
            contextValue: SecretItem.contextValue
        };
    }
}
