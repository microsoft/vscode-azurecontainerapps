/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ViewColumn } from "vscode";
import { ext } from "../extensionVariables";
import { WebviewController } from "./extension-server/WebviewController";

export type ConfirmationViewControllerType = {
    title: string;
    items: Array<{
        name: string;
        value: string;
        valueInContext: string;
    }>;
}

export class ConfirmationViewController extends WebviewController<ConfirmationViewControllerType> {
    constructor(viewConfig: ConfirmationViewControllerType) {
        super(ext.context, viewConfig.title, 'confirmationView', viewConfig, ViewColumn.Active);
    }
}
