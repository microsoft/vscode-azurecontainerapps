/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ViewColumn } from "vscode";
import { ext } from "../extensionVariables";
import { WebviewController } from "./extension-server/WebviewController";

export type ConfirmationViewControllerType = Array<{
    name: string;
    value: string;
    valueInContext: string;
}>

export class ConfirmationViewController extends WebviewController<ConfirmationViewControllerType> {
    constructor(viewConfig: ConfirmationViewControllerType) {
        const title = 'Confirmation View';
        super(ext.context, title, 'confirmationView', viewConfig, ViewColumn.Active)
    }
}
