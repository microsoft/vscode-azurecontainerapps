/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "./localize";

export const recommendedPickDescription: string = localize('recommended', '(recommended)');

export function isRecommendedPick(pick: IAzureQuickPickItem<unknown>): boolean {
    return new RegExp(recommendedPickDescription, 'i').test(pick.description ?? '');
}

export const currentlyDeployedPickDescription: string = localize('currentlyDeployed', '(currently deployed)');

export function isCurrentlyDeployedPick(pick: IAzureQuickPickItem<unknown>): boolean {
    return new RegExp(currentlyDeployedPickDescription, 'i').test(pick.description ?? '');
}
