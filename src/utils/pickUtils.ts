/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "./localize";

export const recommendedPickDescription: string = localize('recommended', '(recommended)');
export const currentlyDeployedPickDescription: string = localize('currentlyDeployed', '(currently deployed)');

export function hasMatchingPickDescription(pick: IAzureQuickPickItem<unknown>, pickDescription: string): boolean {
    return new RegExp(pickDescription, 'i').test(pick.description ?? '');
}
