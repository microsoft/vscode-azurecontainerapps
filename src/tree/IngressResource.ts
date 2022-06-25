/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { IngressConstants } from "../constants";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppExtResource } from "../resolver/ContainerAppExtResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResource } from "./IAzureResource";

const label: string = localize('ingress', 'Ingress');

export class IngressResource extends ContainerAppChildResource<Ingress | undefined> implements IAzureResource {
    public data: Ingress;

    public label: string;
    public description: string | undefined;
    public idSuffix: string = 'ingress';

    constructor(data: Ingress | undefined, containerApp: ContainerAppResource, parentId: string) {
        super(containerApp);
        this.data = data ?? {};
        this.id = `${parentId}/${this.idSuffix}`

        this.label = label;
        this.description = data ? undefined : localize('disabled', 'Disabled');

        this.isParent = !!data;
        this.contextValuesToAdd.push('ingress', data ? 'enabled' : 'disabled');
    }

    public isIngressEnabled(): boolean {
        return 'fqdn' in this.data;
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<unknown>[]> {
        if (!this.isIngressEnabled) {
            return [];
        }

        const label: string = this.data.external ? IngressConstants.external : IngressConstants.internal;
        const description: string = this.data.external ? IngressConstants.externalDesc : IngressConstants.internalDesc;

        return [
            new ContainerAppExtResource(this.containerApp,
                {
                    id: `${this.id}/targetport`, label: localize('targetPort', 'Target Port'),
                    contextValuesToAdd: ['targetPort'], maskValuesToAdd: [], description: String(this.data.targetPort),
                    iconPath: new ThemeIcon('dash'), data: this.data
                }),
            new ContainerAppExtResource(this.containerApp,
                {
                    id: `${this.id}/visibility`, label,
                    contextValuesToAdd: ['visibility'], maskValuesToAdd: [], description, iconPath: new ThemeIcon('dash'),
                    data: undefined
                })
        ];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public get iconPath(): TreeItemIconPath {
        return this.isIngressEnabled() ? treeUtils.getIconPath('10061-icon-Virtual Networks-Networking') :
            new ThemeIcon('debug-disconnect');
    }
}
