/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

// This file is just for testing purporses and will be removed

import { ViewColumn } from "vscode";
import { ConfirmationViewController } from "./confirmationViewController";

// Todo: remove. This is a placeholder function to simulate the view being opened
export function openConfirmationView() {
    const confirmationView = new ConfirmationViewController(viewConfig);
    confirmationView.revealToForeground(ViewColumn.Active);
}

// Todo: remove. This is mock data just for testing
const viewConfig = [
    {
        name: 'Name',
        value: 'Value',
        valueInContext: 'Value in Context'
    },
    {
        name: 'Name 2',
        value: 'Value 2',
        valueInContext: 'Value in Context 2'
    },
    {
        name: 'Name 3',
        value: 'Value 3',
        valueInContext: 'Value in Context 3'
    },
    {
        name: 'Name 4',
        value: 'Value 4',
        valueInContext: 'Value in Context 4'
    },
    {
        name: 'Name 5',
        value: 'Value 5',
        valueInContext: 'Value in Context 5'
    }
];
