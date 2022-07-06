/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppExtResource } from "../resolver/ContainerAppExtResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { localize } from "../utils/localize";

export class LogsResource extends ContainerAppChildResource<undefined> {
    public static contextValue: string = 'log';

    public label: string;
    public description: string | undefined;
    public idSuffix: string = 'logParent';
    public isParent: boolean = true;

    constructor(containerApp: ContainerAppResource, parentId: string) {
        super(containerApp);

        this.id = `${parentId}/${this.idSuffix}`;
        this.label = localize('logs', 'Logs');
        this.contextValuesToAdd.push(LogsResource.contextValue);
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('book');
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<undefined>[]> {
        const iconPath = new ThemeIcon('link-external');
        return [
            new ContainerAppExtResource(this.containerApp, {
                label: localize('openLogs', 'Open Logs'), contextValuesToAdd: ['openLogs'], maskValuesToAdd: [],
                commandId: 'containerApps.openInPortal', iconPath, id: `${this.containerApp.id}/logs`, data: undefined
            }),
            new ContainerAppExtResource(this.containerApp, {
                label: localize('openLogStream', 'Open Log Stream'), contextValuesToAdd: ['openLogStream'], maskValuesToAdd: [],
                commandId: 'containerApps.openInPortal', iconPath, id: `${this.containerApp.id}/logstream`, data: undefined
            })
        ];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
