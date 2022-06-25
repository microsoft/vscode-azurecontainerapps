/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";
import { IAzureResource } from "./IAzureResource";
import { ScaleRuleResource } from "./ScaleRuleResource";

export class ScaleRuleGroupResource extends ContainerAppChildResource<ScaleRule[]> implements IAzureResource {
    public static contextValue: string = 'scaleRules';

    public label: string;
    public description?: string | undefined;
    public data: ScaleRule[];

    public idSuffix: string = 'scaleRules';

    constructor(containerApp: ContainerAppResource, data: ScaleRule[], parentId: string) {
        super(containerApp);

        this.id = `${parentId}/${this.idSuffix}`;
        this.label = localize('scaleRules', 'Scale Rules');
        this.data = data;
        this.isParent = true;

        this.contextValuesToAdd.push(ScaleRuleGroupResource.contextValue, azResourceContextValue);
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<ScaleRule>[]> {
        return this.data.map(sr => new ScaleRuleResource(this.containerApp, sr, this.id));
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
