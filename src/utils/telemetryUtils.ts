/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { currentlyDeployedPickDescription, recommendedPickDescription } from "../constants";

export function isRecommendedPick(pick: IAzureQuickPickItem<unknown>): boolean {
    return new RegExp(recommendedPickDescription).test(pick.description ?? '');
}

export function isCurrentlyDeployedPick(pick: IAzureQuickPickItem<unknown>): boolean {
    return new RegExp(currentlyDeployedPickDescription).test(pick.description ?? '');
}
