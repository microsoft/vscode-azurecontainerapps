/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { CreateProjectViewController } from "../../webviews/CreateProjectViewController";

export function createProjectWithCopilot(_context: IActionContext): void {
    const controller = new CreateProjectViewController({
        title: localize('createProjectWithCopilot', 'Create with Copilot'),
    });
    controller.revealToForeground();
}
