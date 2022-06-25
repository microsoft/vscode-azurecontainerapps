/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { IAzureResource } from "./IAzureResource";

export class ScaleRuleResource extends ContainerAppChildResource<ScaleRule> implements IAzureResource {
    public static contextValue: string = 'scaleRule';
    public data: ScaleRule;

    public label: string;
    public idSuffix: string = 'scaleRule';

    constructor(containerApp: ContainerAppResource, data: ScaleRule, parentId: string) {
        super(containerApp);
        this.data = data;
        this.id = `${parentId}/${this.idSuffix}`;
        this.label = nonNullProp(data, 'name');

        this.contextValuesToAdd.push(ScaleRuleResource.contextValue, azResourceContextValue);
    }

    public get description(): string {
        if (this.data.http) return localize('http', "HTTP");
        else if (this.data.azureQueue) return localize('azureQueue', 'Azure Queue');
        else if (this.data.custom) return localize('custom', 'Custom');
        else return localize('unknown', 'Unknown');
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('dash');
    }
}
