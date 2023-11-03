/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import type { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { appProvider, operationalInsightsProvider, registryProvider, webProvider } from "../constants";

/**
 * Use to obtain a `VerifyProvidersStep` that registers all known container app providers to the user's subscription
 */
export function getVerifyProvidersStep<T extends ISubscriptionActionContext>(): VerifyProvidersStep<T> {
    return new VerifyProvidersStep<T>([
        appProvider,
        operationalInsightsProvider,
        webProvider,
        registryProvider
    ]);
}
