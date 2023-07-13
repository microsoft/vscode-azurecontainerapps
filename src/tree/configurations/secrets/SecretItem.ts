/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Secret } from "@azure/arm-appcontainers";
import { createContextValue } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem } from "vscode";
import type { ContainerAppModel } from "../../ContainerAppItem";
import type { ContainerAppsItem } from "../../ContainerAppsBranchDataProvider";
import { SecretsItem } from "./SecretsItem";

export class SecretItem implements ContainerAppsItem {
    static readonly contextValue: string = 'secretItem';
    static readonly contextValueRegExp: RegExp = new RegExp(SecretItem.contextValue);

    static readonly visibleSecretContextValue: string = 'visibleSecret:true';
    static readonly invisibleSecretContextValue: string = 'visibleSecret:false';

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly secret: Secret) { }

    id: string = `${this.containerApp.id}/${SecretsItem.idSuffix}/${this.secret.name}`;

    private visibleSecret: boolean = false;

    private get contextValue(): string {
        const values: string[] = [SecretItem.contextValue];
        values.push(this.visibleSecret ? SecretItem.visibleSecretContextValue : SecretItem.invisibleSecretContextValue);
        return createContextValue(values);
    }

    toggleSecretVisibility(): void {
        this.visibleSecret = !this.visibleSecret;
    }

    getTreeItem(): TreeItem {
        return {
            label: this.visibleSecret ? this.secret.value : this.secret.name,
            iconPath: new ThemeIcon('dash'),
            contextValue: this.contextValue
        };
    }
}
