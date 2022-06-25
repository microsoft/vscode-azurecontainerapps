/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, Revision, Scale } from "@azure/arm-appcontainers";
import { AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { IAzureResource } from './IAzureResource';
import { ScaleResource } from "./ScaleResource";

export class RevisionResource extends ContainerAppChildResource<Revision> implements IAzureResource {
    public static contextValue: string = 'revision';
    public data: Revision;

    public name: string;
    public label: string;
    public idSuffix: string = 'revision';

    constructor(re: Revision, containerApp: ContainerAppResource) {
        super(containerApp);
        this.data = re;

        this.id = nonNullProp(this.data, 'id');
        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
        this.isParent = true

        this.contextValuesToAdd.push(RevisionResource.contextValue, azResourceContextValue);
    }

    public get description(): string | undefined {
        return !this.data.active ?
            localize('inactive', 'Inactive') :
            this.name === this.containerApp.data.latestRevisionName ?
                localize('latest', 'Latest') :
                undefined;
    }

    public get iconPath(): TreeItemIconPath {
        let id: string;
        let colorId: string;

        if (!this.data.active) {
            id = 'circle-slash';
            colorId = 'testing.iconUnset';
        } else {
            switch (this.data.provisioningState) {
                case KnownRevisionProvisioningState.Deprovisioning:
                case KnownRevisionProvisioningState.Provisioning:
                    id = 'play-circle';
                    colorId = 'testing.iconUnset';
                    break;
                case KnownRevisionProvisioningState.Failed:
                    id = 'error';
                    colorId = 'testing.iconFailed';
                    break;
                case KnownRevisionProvisioningState.Provisioned:
                    id = 'pass'
                    colorId = 'testing.iconPassed';
                    break;
                case KnownRevisionProvisioningState.Deprovisioned:
                default:
                    id = 'circle-slash';
                    colorId = 'testing.iconUnset';
            }
        }

        return new ThemeIcon(id, colorId ? new ThemeColor(colorId) : undefined);
    }

    public async refreshImpl(_context: IActionContext): Promise<void> {
        // this.data = await this.parent.getRevision(context, this.name);
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<Scale | undefined>[]> {
        return [
            new ScaleResource(this.containerApp, this.containerApp.data.template?.scale, this.id)
        ];
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        for (const expectedContextValue of expectedContextValues) {
            if (expectedContextValue instanceof RegExp) {
                if (expectedContextValue.test(ScaleResource.contextValue)) return // this.scaleTreeItem;
            } else {
                switch (expectedContextValue) {
                    case ScaleResource.contextValue:
                        return // this.scaleTreeItem;
                    default:
                }
            }
        }

        return undefined;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
