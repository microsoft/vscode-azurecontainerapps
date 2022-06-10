/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, Revision } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { RevisionsTreeItem } from "./RevisionsTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class RevisionTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'revision';
    public readonly contextValue: string = `${RevisionTreeItem.contextValue}|${azResourceContextValue}`;
    public data: Revision;
    public readonly parent: RevisionsTreeItem;

    public scaleTreeItem: ScaleTreeItem;

    public name: string;
    public label: string;

    constructor(parent: RevisionsTreeItem, re: Revision) {
        super(parent);
        this.data = re;

        this.id = nonNullProp(this.data, 'id');
        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
    }

    public get description(): string | undefined {
        return !this.data.active ?
            localize('inactive', 'Inactive') :
            this.name === this.parent.parent.data.latestRevisionName ?
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

    public async refreshImpl(context: IActionContext): Promise<void> {
        this.data = await this.parent.getRevision(context, this.name);
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        this.scaleTreeItem = new ScaleTreeItem(this, this.data.template?.scale);
        return [this.scaleTreeItem];
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        for (const expectedContextValue of expectedContextValues) {
            if (expectedContextValue instanceof RegExp) {
                if (expectedContextValue.test(ScaleTreeItem.contextValue)) return this.scaleTreeItem;
            } else {
                switch (expectedContextValue) {
                    case ScaleTreeItem.contextValue:
                        return this.scaleTreeItem;
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
