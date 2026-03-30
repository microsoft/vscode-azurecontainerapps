/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type WebviewPanel } from 'vscode';

export const SharedState = {
    itemsToClear: 0,
    cancelled: true,
    copilotClicked: false,
    editingPicks: false,
    currentPanel: undefined as WebviewPanel | undefined,
};
